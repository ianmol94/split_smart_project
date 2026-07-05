const User = require('../models/users'); //interacts with users collection 
const jwt = require('jsonwebtoken'); //used to create JWTs after successful register/login 


//by using userId JWT_SECRET signs the token so it can't be tampered with
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

//USER registration flow 
// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {

    //here it extracts name, email,password from request body 
    const { name, email, password } = req.body;

    //checks if email exists and res is send with message
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    //creating user and also generating JWT 
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    //sending response to client after registration 
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err); // passes to error.middleware.js
  }
};

//LOGIN flow 
// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    //extracting email, password 
    const { email, password } = req.body;


    //finding user 
    const user = await User.findOne({ email });
    //return 401 status if user not found 
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    //also sending same message when password is not matched 
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    //generating JWT if user logged in sucessfully 
    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};