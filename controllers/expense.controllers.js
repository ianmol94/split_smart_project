const Expense = require('../models/expense');
const Group = require('../models/group');
const AppError = require('../utils/AppError');

// ─── POST /api/expenses ────────────────────────────────────────────────
exports.addExpense = async (req, res, next) => {
  try {
    const { description, amount, group, splitBetween, splitType } = req.body;

    // Check group exists
    const groupDoc = await Group.findById(group);
    if (!groupDoc) return next(new AppError('Group not found', 404));

    // Check all splitBetween users are group members
    const allMembers = groupDoc.members.map(m => m.toString());
    const validSplit = splitBetween.every(userId => allMembers.includes(userId));
    if (!validSplit) return next(new AppError('Some users are not group members', 400));

    const expense = await Expense.create({
      description,
      amount,
      paidBy: req.user._id,   // logged in user paid
      group,
      splitBetween,
      splitType: splitType || 'equal'
    });

    await expense.populate('paidBy', 'name email');
    await expense.populate('splitBetween', 'name email');

    res.status(201).json({ success: true, expense });
  } catch (err) { next(err); }
};

// ─── GET /api/expenses/group/:groupId ─────────────────────────────────
exports.getGroupExpenses = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return next(new AppError('Group not found', 404));

    // Only group members can see expenses
    const isMember = group.members
      .map(m => m.toString())
      .includes(req.user._id.toString());
    if (!isMember) return next(new AppError('Not a group member', 403));

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('splitBetween', 'name email')
      .sort({ createdAt: -1 }); // newest first

    res.json({ success: true, count: expenses.length, expenses });
  } catch (err) { next(err); }
};

// ─── GET /api/expenses/:expenseId ─────────────────────────────────────
exports.getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId)
      .populate('paidBy', 'name email')
      .populate('splitBetween', 'name email')
      .populate('group', 'name');

    if (!expense) return next(new AppError('Expense not found', 404));

    res.json({ success: true, expense });
  } catch (err) { next(err); }
};

// ─── PUT /api/expenses/:expenseId ─────────────────────────────────────
exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return next(new AppError('Expense not found', 404));

    // Only the person who paid can edit
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this expense', 403));
    }

    const { description, amount, splitBetween, splitType } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (splitBetween) expense.splitBetween = splitBetween;
    if (splitType) expense.splitType = splitType;

    await expense.save();
    await expense.populate('paidBy', 'name email');
    await expense.populate('splitBetween', 'name email');

    res.json({ success: true, expense });
  } catch (err) { next(err); }
};

// ─── DELETE /api/expenses/:expenseId ──────────────────────────────────
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return next(new AppError('Expense not found', 404));

    // Only the person who paid can delete
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this expense', 403));
    }

    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) { next(err); }
};

// ─── GET /api/expenses/group/:groupId/balances ────────────────────────
exports.getGroupBalances = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'name email');
    if (!group) return next(new AppError('Group not found', 404));

    const expenses = await Expense.find({ group: req.params.groupId });

    // Step 1 — net balance map  (+ve = owed money, -ve = owes money)
    const balanceMap = {};
    group.members.forEach(m => { balanceMap[m._id.toString()] = 0; });

    expenses.forEach(expense => {
      const { amount, paidBy, splitBetween, splitType } = expense;
      const n = splitBetween.length;
      if (n === 0) return;

      let share = 0;
      if (splitType === 'equal') share = amount / n;

      const payerId = paidBy.toString();

      // Payer gets credit for full amount
      balanceMap[payerId] = (balanceMap[payerId] || 0) + amount;

      // Each member in split owes their share
      splitBetween.forEach(userId => {
        const uid = userId.toString();
        if (splitType === 'equal') {
          balanceMap[uid] = (balanceMap[uid] || 0) - share;
        }
      });
    });

    // Step 2 — Greedy settlement (minimum transactions)
    // Separate into creditors (+ve) and debtors (-ve)
    const creditors = []; // people owed money
    const debtors = [];   // people who owe money

    group.members.forEach(member => {
      const bal = balanceMap[member._id.toString()];
      if (bal > 0.01) creditors.push({ id: member._id.toString(), name: member.name, amount: bal });
      if (bal < -0.01) debtors.push({ id: member._id.toString(), name: member.name, amount: -bal });
    });

    // Greedily match largest creditor with largest debtor
    const settlements = [];
    let i = 0, j = 0;

    while (i < creditors.length && j < debtors.length) {
      const credit = creditors[i];
      const debt = debtors[j];
      const settled = Math.min(credit.amount, debt.amount);

      settlements.push({
        from: debt.name,
        to: credit.name,
        amount: parseFloat(settled.toFixed(2))
      });

      credit.amount -= settled;
      debt.amount -= settled;

      if (credit.amount < 0.01) i++;
      if (debt.amount < 0.01) j++;
    }

    // Step 3 — Build readable per-member summary
    const summary = group.members.map(member => ({
      user: { id: member._id, name: member.name, email: member.email },
      balance: parseFloat((balanceMap[member._id.toString()] || 0).toFixed(2)),
      status: balanceMap[member._id.toString()] > 0.01 ? 'gets back'
            : balanceMap[member._id.toString()] < -0.01 ? 'owes'
            : 'settled up'
    }));

    res.json({ success: true, summary, settlements });
  } catch (err) { next(err); }
};