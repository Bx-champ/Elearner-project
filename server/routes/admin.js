const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get summary stats
router.get('/admin/user-stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, today, thisMonth, online] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ isOnline: true }) // You must maintain `isOnline` field
    ]);

    res.json({ total, today, thisMonth, online });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get latest 10 users
router.get('/admin/recent-users', async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt');

    res.json(recentUsers);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch recent users' });
  }
});

module.exports = router;
