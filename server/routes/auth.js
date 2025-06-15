const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
// const { adminLogin } = require('../controllers/adminController');


const router = express.Router();

router.post('/signup', async (req, res) => {
  const {name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name ,email, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: 'User created' });
});

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email belongs to an admin
    let user = await Admin.findOne({ email });
    let role = 'admin';

    if (!user) {
      // If not admin, check in User model
      user = await User.findOne({ email });
      role = 'user';
    }

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, role, message: `${role} login success` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// router.post('/admin/login', adminLogin); 

module.exports = router;
/////////previous
