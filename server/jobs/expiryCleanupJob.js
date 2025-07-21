const ChapterAssignment = require('../models/ChapterAssignment');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const User = require('../models/User'); // ✅ Import user

async function cleanExpiredAssignments(io, userSockets) {
  const now = new Date();
  const expired = await ChapterAssignment.find({ expiresAt: { $lte: now } });

  for (const assign of expired) {
    const { userId, bookId, chapterId, assignedAt, expiresAt } = assign;

    const book = await Book.findById(bookId);
    const user = await User.findById(userId);
    const chapter = book?.chapters?.find(ch => ch._id.toString() === chapterId.toString());

    if (book && chapter && user) {
      // 🧮 Duration in days
      const assignedDate = new Date(assignedAt);
      const expiryDate = new Date(expiresAt);
      const durationMs = expiryDate - assignedDate;
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      // 📩 USER notification
      const userMessage = `⏳ Your access to chapter "${chapter.name}" in "${book.name}" has expired.`;
      const userNotification = await Notification.create({
        userId,
        message: userMessage,
        type: 'expired',
        forAdmin: false
      });

      const socketId = userSockets.get(userId.toString());
      if (io && socketId) {
        io.to(socketId).emit('notification', userNotification);
      }

      // 📢 ADMIN notification
      const adminMessage = `🔔 Access expired for user **${user.name} (${user.email})** to chapter "${chapter.name}" from book "${book.name}".
🗓️ Assigned: ${assignedDate.toLocaleDateString()}
🛑 Expired: ${expiryDate.toLocaleDateString()}
📆 Duration: ${durationDays} day(s)`;

      await Notification.create({
        message: adminMessage,
        type: 'expired',
        forAdmin: true
      });
    }

    // ❌ Remove expired assignment
    await ChapterAssignment.findByIdAndDelete(assign._id);
  }

  if (expired.length > 0) {
    console.log(`🧹 ${expired.length} expired chapter assignments cleaned.`);
  }
}

module.exports = cleanExpiredAssignments;
