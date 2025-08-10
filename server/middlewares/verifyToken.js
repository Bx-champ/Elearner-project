// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const Admin = require('../models/Admin');
// const Vendor = require('../models/Vendor');

// module.exports = async function (req, res, next) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const { id, role } = decoded;

//     let user;
//     if (role === 'user') {
//       user = await User.findById(id);
//     } else if (role === 'admin') {
//       user = await Admin.findById(id);
//     } else if (role === 'vendor') {
//       user = await Vendor.findById(id);
//     }

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid token - user not found' });
//     }

//     // 🔴 Important: Check token match
//     if (user.currentToken !== token) {
//       return res.status(401).json({ message: 'Session expired or logged in elsewhere' });
//     }

//     req.user = user;
//     req.role = role;
//     next();

//   } catch (err) {
//     console.error('Token verification failed:', err);
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };





const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');



module.exports = (allowedRoles = []) => async (req, res, next) =>{
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;


    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
    }

    let user;
    if (role === 'user') {
      user = await User.findById(id);
    } else if (role === 'admin') {
      user = await Admin.findById(id);
    } else if (role === 'vendor') {
      user = await Vendor.findById(id);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    // 🔴 Important: Check token match
    if (user.currentToken !== token) {
      return res.status(401).json({ message: 'Session expired or logged in elsewhere' });
    }

    req.user = decoded;
    next();

  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
