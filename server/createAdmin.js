// createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const existing = await Admin.findOne({ email: 'admin@example.com' });
    if (existing) {
      console.log('Admin already exists');
      return process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
    });

    await admin.save();
    console.log('Admin created successfully!');
    process.exit();
  })
  .catch((err) => {
    console.error('Error connecting to DB', err);
    process.exit(1);
  });
