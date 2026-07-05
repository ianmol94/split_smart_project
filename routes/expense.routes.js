const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const {
  addExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getGroupBalances
} = require('../controllers/expense.controllers');

// All expense routes are protected
router.use(protect);

// Core CRUD
router.post('/', addExpense);                          // POST   /api/expenses
router.get('/group/:groupId', getGroupExpenses);       // GET    /api/expenses/group/:groupId
router.get('/:expenseId', getExpenseById);             // GET    /api/expenses/:expenseId
router.put('/:expenseId', updateExpense);              // PUT    /api/expenses/:expenseId
router.delete('/:expenseId', deleteExpense);           // DELETE /api/expenses/:expenseId

// Balance calculation — the core feature
router.get('/group/:groupId/balances', getGroupBalances); // GET /api/expenses/group/:groupId/balances

module.exports = router;