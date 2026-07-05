const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    description:{
        type: String, 
        required:true,
    },

    amount:{
        type:number,
        required:true,
        min:0, 
    }, 

    paidBy:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:'Group', 
        required:true,

    }, 

    splitBetween:{
        type:mongoose.Schema.Types.ObjectId,
        required:true, 
        ref:'User',
    }, 

    splitType: { 
    type: String, 
    enum: ['equal', 'exact', 'percent'], 
    default: 'equal' 
  },
     
}, { timestamps: true });

module.exports = mongoose.models('Expense', expenseSchema)
