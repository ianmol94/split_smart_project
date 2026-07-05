const mongoose = require("mongoose")
const bcrpyt = require("bcryptjs")

const userSchema = new mongoose.Schema(
    {
        name : {
            type: String,
            required: true,
            trim: true, 
        },
        email: {
            type: String,
            required:true, 
            unique:true,
            lowercase:true, 
        }, 
        password:{
            type: String, 
            required:true,
            minLength:8,
        },
        timestamps:true     
    }
); 

//Middleware
userSchema.pre('save', async function (next) { // run this async function before calling .save()
  if (!this.isModified('password')) return next(); //check if password field is modified, yes, move next
  this.password = await bcrypt.hash(this.password, 10); //password->hashing, 10->salt rounds(makes the password more secure)
  next();//telling mongoose to continue saving document
});

userSchema.methods.comparePassword = async function (enteredPassword) { //comparePassword->method created, a funciton compares only enteredPassword, in bcrypt library enteredPassword is hashed with same salt rounds, compared with stored password by taking this.password->stored in DB
  return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User',userSchema); //creates model of the name "User" with schema of "userSchema", also exports so other files can use it. 