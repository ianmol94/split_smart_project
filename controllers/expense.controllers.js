const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { assertMembership } = require('./group.controller');

const round2 = (n) => Math.round(n * 100) / 100;


const buildSplits = (amount, splitType, participants) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new ApiError(400, 'At least one participant is required to split an expense');
  }

  if (splitType === 'equal') {
    const share = round2(amount / participants.length);
    const splits = participants.map((p) => ({ user: p.user || p, amount: share }));
    const remainder = round2(amount - share * participants.length);
    if (remainder !== 0) splits[0].amount = round2(splits[0].amount + remainder);
    return splits;
  }

  if (splitType === 'exact') {
    const splits = participants.map((p) => ({ user: p.user, amount: round2(p.amount) }));
    const sum = round2(splits.reduce((acc, s) => acc + s.amount, 0));
    if (sum !== round2(amount)) {
      throw new ApiError(400, `Exact split amounts (${sum}) must add up to the total (${amount})`);
    }
    return splits;
  }

  if (splitType === 'percentage') {
    const totalPct = participants.reduce((acc, p) => acc + Number(p.percentage), 0);
    if (round2(totalPct) !== 100) {
      throw new ApiError(400, `Percentages must add up to 100 (got ${totalPct})`);
    }
    return participants.map((p) => ({
      user: p.user,
      amount: round2((Number(p.percentage) / 100) * amount)
    }));
  }

  throw new ApiError(400, `Unsupported splitType: ${splitType}`);
};


const addExpense = asyncHandler(async (req, res) => {
  const {
    group: groupId,
    description,
    amount,
    paidBy,
    splitType = 'equal',
    participants
  } = req.body;

  if (!groupId || !description || !amount) {
    throw new ApiError(400, 'group, description and amount are required');
  }

  const group = await Group.findById(groupId);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }
  assertMembership(group, req.user._id);

  const payerId = paidBy || req.user._id;
  const payerIsMember = group.members.some((m) => m.toString() === payerId.toString());
  if (!payerIsMember) {
    throw new ApiError(400, 'The payer must be a member of the group');
  }


  const effectiveParticipants =
    participants && participants.length ? participants : group.members.map((m) => ({ user: m }));

  for (const p of effectiveParticipants) {
    const uid = (p.user || p).toString();
    if (!group.members.some((m) => m.toString() === uid)) {
      throw new ApiError(400, 'All participants must be members of the group');
    }
  }

  const splits = buildSplits(Number(amount), splitType, effectiveParticipants);

  const expense = await Expense.create({
    group: groupId,
    description,
    amount: Number(amount),
    paidBy: payerId,
    splitType,
    splits,
    createdBy: req.user._id
  });

  await expense.populate([
    { path: 'paidBy', select: 'name email' },
    { path: 'splits.user', select: 'name email' }
  ]);

  res.status(201).json({ success: true, expense });
});


const getExpensesByGroup = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }
  assertMembership(group, req.user._id);

  const expenses = await Expense.find({ group: req.params.groupId })
    .populate('paidBy', 'name email')
    .populate('splits.user', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: expenses.length, expenses });
});


const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const group = await Group.findById(expense.group);
  assertMembership(group, req.user._id);

  
  const isCreator = expense.createdBy.toString() === req.user._id.toString();
  const isPayer = expense.paidBy.toString() === req.user._id.toString();
  if (!isCreator && !isPayer) {
    throw new ApiError(403, 'Only the expense creator or payer can delete this expense');
  }

  await expense.deleteOne();
  res.status(200).json({ success: true, deleted: req.params.id });
});


const getGroupBalances = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.groupId).populate('members', 'name email');
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }
  assertMembership(group, req.user._id);

  const expenses = await Expense.find({ group: req.params.groupId });

  const net = {}; // userId -> net balance
  group.members.forEach((m) => (net[m._id.toString()] = 0));

  expenses.forEach((exp) => {
    const payerId = exp.paidBy.toString();
    net[payerId] = (net[payerId] || 0) + exp.amount;
    exp.splits.forEach((s) => {
      const uid = s.user.toString();
      net[uid] = (net[uid] || 0) - s.amount;
    });
  });

  Object.keys(net).forEach((k) => (net[k] = round2(net[k])));

  
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.01)
    .map(([user, amount]) => ({ user, amount }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.01)
    .map(([user, amount]) => ({ user, amount: -amount }))
    .sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({ from: debtors[i].user, to: creditors[j].user, amount: round2(pay) });

    debtors[i].amount = round2(debtors[i].amount - pay);
    creditors[j].amount = round2(creditors[j].amount - pay);

    if (debtors[i].amount <= 0.01) i++;
    if (creditors[j].amount <= 0.01) j++;
  }

  const memberMap = Object.fromEntries(group.members.map((m) => [m._id.toString(), m]));

  res.status(200).json({
    success: true,
    balances: Object.entries(net).map(([userId, amount]) => ({
      user: memberMap[userId],
      netBalance: amount
    })),
    settlements: settlements.map((s) => ({
      from: memberMap[s.from],
      to: memberMap[s.to],
      amount: s.amount
    }))
  });
});

module.exports = { addExpense, getExpensesByGroup, deleteExpense, getGroupBalances };