const jwt = require('jsonwebtoken'); //verifies JWT 
const User = require('../models/users'); //fetches user details form mongoDB

//middleware function, and receives req,res,next 
exports.protect = async (req, res, next) => {
  try {
    //gets authorization from client like Authorization: Bearer eyJhbGciOiJIUzI1Ni...
    const authHeader = req.headers.authorization;

    //checks token exist or not 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    //extracting of token, split creates : ["Bearer", "abc.xyz.123"], [1] == token 
    const token = authHeader.split(' ')[1];

    //verifying the token 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //finding the user by decoded token and id
    req.user = await User.findById(decoded.id).select('-password');

    //if user don't exists, return this 
    if (!user) {
  return res.status(401).json({
    message: 'User no longer exists'
  });
}
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};