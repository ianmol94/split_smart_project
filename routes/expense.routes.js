const express = require('express');
const {
  addExpense,
  getExpensesByGroup,
  deleteExpense,
  getGroupBalances
} = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // every expense route requires authentication

router.route('/').post(addExpense);
router.route('/:id').delete(deleteExpense);
router.route('/group/:groupId').get(getExpensesByGroup);
router.route('/group/:groupId/balances').get(getGroupBalances);

module.exports = router;