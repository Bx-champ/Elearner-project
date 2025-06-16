const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');
// const { adminLogin } = require('../controllers/adminController');


const router = express.Router();

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;
    let role;

    // Check Admin
    user = await Admin.findOne({ email });
    if (user) role = 'admin';

    // Check User
    if (!user) {
      user = await User.findOne({ email });
      if (user) role = 'user';
    }

    // Check Vendor
    if (!user) {
      user = await Vendor.findOne({ email });
      if (user) role = 'vendor';
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return res.status(200).json({ token, role, message: `${role} login success` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});



router.post('/vendor/signup', async (req, res) => {
  const { instituteName, representativeName, email, phone, password } = req.body;

  try {
    const existingUser = await User.findOne({email});
    if(existingUser) return res.status(400).json({ message: 'user cannot be vendor' });
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) return res.status(400).json({ message: 'Vendor already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = new Vendor({
      instituteName,
      representativeName,
      email,
      phone,
      password: hashedPassword,
    });

    await vendor.save();
    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// User Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) return res.status(400).json({ message: 'Vendor cannot be user' });
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});




// router.post('/admin/login', adminLogin); 

module.exports = router;
/////////previous
