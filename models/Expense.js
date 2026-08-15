const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // amount this user owes for this expense
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal'
    },
    // how the expense is split among participants
    splits: {
      type: [splitSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'An expense must have at least one participant'
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);