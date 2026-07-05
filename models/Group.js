const mongoose = require("mongoose"); 

const groupSchema = new mongoose.Schema(
  {  name: {
        type:String, 
        required : true, 
        trim:true, 
    },

    description : {
        type: String, 
    }, 

    createdBy : {
        type: mongoose.Schema.Types.ObjectId, //taking ObjectId->unique for each user,
        required: true,
        ref: 'User',  //refering to a document in 'User' model 
        
    }, 
    members : [{
        type:mongoose.Schema.Types.ObjectId, 
        ref:'User', 
    }], 
    timestamps:true, 

}); 

module.exports = mongoose.model('Group', groupSchema); 