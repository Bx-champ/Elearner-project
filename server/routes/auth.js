const express = require('express');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const Notification = require('../models/Notification');

const User = require('../models/User');
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');
const Book = require('../models/Book');
const ChapterAccessRequest = require('../models/ChapterAccessRequest');
require('dotenv').config();

const router = express.Router();

// S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});


//////////////////////////////////////////////////////////////////////////////
const createNotification = async ({ userId, message, type }, req = null) => {
  try {
    const notification = await new Notification({ userId, message, type }).save();

    if (req) {
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const socketId = userSockets.get(userId.toString());
      if (io && socketId) io.to(socketId).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    console.error('🔔 Notification error:', err.message);
  }
};


////////////////////////////////////////////////////////////////////////////




// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Helper to upload file to S3
const uploadFileToS3 = async (buffer, key, mimetype) => {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype
  }));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

// ==================== AUTH ====================
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user, role;
    user = await Admin.findOne({ email });
    if (user) role = 'admin';
    if (!user) {
      user = await User.findOne({ email });
      if (user) role = 'user';
    }
    if (!user) {
      user = await Vendor.findOne({ email });
      if (user) role = 'vendor';
    }
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const userInfo = {
  _id: user._id,
  name: user.name,
  email: user.email
};

res.json({ token, role, user: userInfo, message: `${role} login success` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (await Vendor.findOne({ email })) return res.status(400).json({ message: 'Vendor cannot be user' });
    if (await User.findOne({ email })) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/vendor/signup', async (req, res) => {
  const { instituteName, representativeName, email, phone, password } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'user cannot be vendor' });
    if (await Vendor.findOne({ email })) return res.status(400).json({ message: 'Vendor already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const vendor = new Vendor({ instituteName, representativeName, email, phone, password: hashedPassword });
    await vendor.save();
    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== BOOK ROUTES ====================
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json({ success: true, books });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch books' });
  }
});

router.get('/book/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ success: true, book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch book' });
  }
});

router.delete('/admin/book/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const deleteObjects = [];
    if (book.coverUrl) deleteObjects.push({ Key: book.coverUrl.split('.com/')[1] });
    book.chapters.forEach(ch => {
      if (ch.pdfUrl) deleteObjects.push({ Key: ch.pdfUrl.split('.com/')[1] });
    });

    if (deleteObjects.length) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: deleteObjects }
      }));
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book and files deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

router.put('/admin/book/:id', upload.any(), async (req, res) => {
  try {
    const { name, subject, tags, contents } = req.body;
    const chaptersMeta = JSON.parse(req.body.chapters);
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Handle cover
    const coverFile = req.files.find(f => f.fieldname === 'cover');
    if (coverFile) {
      if (book.coverUrl) {
        await s3.send(new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: { Objects: [{ Key: book.coverUrl.split('.com/')[1] }] }
        }));
      }
      const coverKey = `books/${Date.now()}-${coverFile.originalname}`;
      book.coverUrl = await uploadFileToS3(coverFile.buffer, coverKey, coverFile.mimetype);
    }

    // Prepare maps
    const existingMap = {};
    book.chapters.forEach(ch => existingMap[ch._id?.toString()] = ch);
    const updatedChapters = [];
    const deleteKeys = [];

    // Loop over incoming chapter metadata
    for (let idx = 0; idx < chaptersMeta.length; idx++) {
      const meta = chaptersMeta[idx];

      // Validate page numbers
      if (meta.fromPage && meta.toPage && Number(meta.fromPage) > Number(meta.toPage)) {
        return res.status(400).json({ message: `Invalid page range in chapter ${meta.name}` });
      }

      if (meta._id && existingMap[meta._id]) {
        // Existing chapter
        const ch = existingMap[meta._id];
        ch.name = meta.name;
        ch.description = meta.description;
        ch.price = meta.price;
        ch.order = idx;
        ch.fromPage = meta.fromPage;
        ch.toPage = meta.toPage;
        ch.subchapters = meta.subchapters || [];
        updatedChapters.push(ch);
        delete existingMap[meta._id];
      } else {
        // New chapter
        let pdfUrl = '';
        const pdfFile = req.files.find(f => f.originalname === meta.uploadedFileName);
        if (pdfFile) {
          const pdfKey = `books/chapters/${Date.now()}-${pdfFile.originalname}`;
          pdfUrl = await uploadFileToS3(pdfFile.buffer, pdfKey, pdfFile.mimetype);
        }

        updatedChapters.push({
          name: meta.name,
          description: meta.description,
          price: meta.price,
          order: idx,
          pdfUrl,
          fromPage: meta.fromPage,
          toPage: meta.toPage,
          subchapters: meta.subchapters || []
        });
      }
    }

    // Delete removed chapter PDFs
    for (const ch of Object.values(existingMap)) {
      if (ch.pdfUrl) {
        deleteKeys.push({ Key: ch.pdfUrl.split('.com/')[1] });
      }
    }

    if (deleteKeys.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: deleteKeys }
      }));
    }

    // Final book update
    book.name = name;
    book.subject = subject;
    book.tags = tags;
    book.contents = contents;
    book.chapters = updatedChapters;
    book.price = updatedChapters.reduce((sum, ch) => sum + Number(ch.price || 0), 0);

    await book.save();
    res.json({ message: '✅ Book updated', book });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: '❌ Update failed' });
  }
});



router.get('/book/:bookId/chapter/:chapterId', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const chapter = book.chapters.id(chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    res.json({
      pdfUrl: book.pdfUrl,
      fromPage: chapter.fromPage,
      toPage: chapter.toPage,
      name: chapter.name,
      description: chapter.description,
      subchapters: chapter.subchapters || [] // ✅ Add this line
    });
  } catch (err) {
    console.error('Error fetching chapter preview:', err);
    res.status(500).json({ message: 'Failed to load chapter preview' });
  }
});




// POST: Request access to chapters
router.post('/request-access', async (req, res) => {
  try {
    // const { userId, bookId, chapterIds } = req.body;

    const token = req.headers.authorization?.split(' ')[1];
if (!token) return res.status(401).json({ message: 'No token provided' });

let decoded;
try {
  decoded = jwt.verify(token, process.env.JWT_SECRET);
} catch (err) {
  return res.status(401).json({ message: 'Invalid token' });
}

const userId = decoded.id;
const { bookId, chapterIds } = req.body;


    if (!userId || !bookId || !Array.isArray(chapterIds) || chapterIds.length === 0) {
      return res.status(400).json({ message: 'Invalid request payload' });
    }

   const existingRequest = await ChapterAccessRequest.findOne({
  userId,
  bookId,
  status: 'pending',
  chapters: { $in: chapterIds }
});


    if (existingRequest) {
      return res.status(409).json({ message: 'Already requested access for selected chapters' });
    }

    const request = new ChapterAccessRequest({
      userId,
      bookId,
      chapters: chapterIds
    });

    await request.save();
//////////////////////////////////////////////////////////////
    const book = await Book.findById(bookId);
const chapterNames = book.chapters
  .filter(ch => chapterIds.includes(ch._id.toString()))
  .map(ch => ch.name);

const message = `📝 Request submitted for book "${book.name}" - chapters: ${chapterNames.join(', ')}`;

await createNotification({ userId, type: 'requestSubmitted', message }, req);

/////////////////////////////////////////////////////////////////////////
    res.status(201).json({ message: '✅ Access request submitted', request });
  } catch (err) {
    console.error('❌ Access request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: All access requests for admin
// router.get('/admin/access-requests', async (req, res) => {
//   try {
//     const requests = await ChapterAccessRequest.find()
//       .populate('userId', 'name email')
//       .populate('bookId', 'name')
//       .sort({ requestedAt: -1 });
//     res.json({ success: true, requests });
//   } catch (err) {
//     console.error('Error fetching access requests:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



router.get('/admin/access-requests', async (req, res) => {
  try {
    const requests = await ChapterAccessRequest.find()
      .populate('userId', 'name email')
      .populate('bookId', 'name chapters') // 👈 include chapters
      .lean() // better performance and easier manipulation
      .sort({ requestedAt: -1 });

    // Transform chapters to show names instead of IDs
    const transformed = requests.map(req => {
      if (!req.bookId || !req.bookId.chapters) return null; // safeguard
      const chapterDetails = req.chapters.map(chId => {
        const found = req.bookId.chapters.find(ch => ch._id.toString() === chId.toString());
        return found ? found.name : 'Unknown Chapter';
      });

      return {
        ...req,
        chapterNames: chapterDetails // 👈 Add this field for frontend use
      };
    }).filter(Boolean);

    res.json({ success: true, requests: transformed });
  } catch (err) {
    console.error('Error fetching access requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// PUT: Admin approves or rejects a request
router.put('/admin/access-request-status', async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await ChapterAccessRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();

   ///////////////////////////////////////////////////////////
   const book = await Book.findById(request.bookId);
const chapterNames = book.chapters
  .filter(ch => request.chapters.includes(ch._id.toString()))
  .map(ch => ch.name);

const message = `✅ Access ${status.toUpperCase()} for "${book.name}" - chapters: ${chapterNames.join(', ')}`;

await createNotification({ 
  userId: request.userId, 
  type: status, 
  message 
}, req);

///////////////////////////////////////////////////////////////// 

    res.json({ message: `✅ Request ${status}` });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/chapter-access/all', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const approvedRequests = await ChapterAccessRequest.find({ userId, status: 'approved' })
      .populate({
  path: 'bookId',
  select: 'name coverUrl chapters'
})

      .lean();

    const bookMap = {};

    approvedRequests.forEach(req => {
      const book = req.bookId;
      if (!book || !book.chapters) return;

      if (!bookMap[book._id]) {
        bookMap[book._id] = {
          _id: book._id,
          name: book.name,
          coverUrl: book.coverUrl,
          chapters: []
        };
      }

      req.chapters.forEach(chId => {
        const chapter = book.chapters.find(c => c._id.toString() === chId.toString());
        if (chapter) {
          bookMap[book._id].chapters.push({
            _id: chapter._id,
            name: chapter.name,
            description: chapter.description,
            fromPage: chapter.fromPage,
            toPage: chapter.toPage,
            price: chapter.price,
            subchapters: chapter.subchapters || [],
          });
        }
      });
    });

    const result = Object.values(bookMap);
    res.json({ success: true, books: result });
  } catch (err) {
    console.error('❌ Error in /user/chapter-access/all:', err);
    res.status(500).json({ message: 'Server error' });
  }
});








// GET: User's approved chapter access for a book
router.get('/user/chapter-access/:bookId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const requests = await ChapterAccessRequest.find({
      userId: decoded.id,
      bookId: req.params.bookId,
      status: 'approved'
    }).lean();

    const accessInfo = requests.flatMap(r => 
  r.chapters.map(chapterId => ({
    chapterId: chapterId.toString()
  }))
);



    res.json({ success: true, accessInfo });
  } catch (err) {
    console.error('Error fetching chapter access:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/admin/users-access', async (req, res) => {
  try {
    const approvedRequests = await ChapterAccessRequest.find({ status: 'approved' })
      .populate('userId', 'name email')
      .populate('bookId', 'name')
      .lean();

    const userAccessMap = {};

    approvedRequests.forEach(req => {
      const userId = req.userId._id.toString();
      if (!userAccessMap[userId]) {
        userAccessMap[userId] = {
          user: req.userId,
          access: []
        };
      }

      req.chapters.forEach(chapterId => {
        userAccessMap[userId].access.push({
          bookId: req.bookId._id,
          bookName: req.bookId.name,
          chapterId
        });
      });
    });

    const result = Object.values(userAccessMap);
    res.json({ success: true, users: result });
  } catch (err) {
    console.error('Error fetching user access info:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/revoke-chapter-access', async (req, res) => {
  const { userId, bookId, chapterId } = req.body;
  if (!userId || !bookId || !chapterId) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const approvedRequest = await ChapterAccessRequest.findOne({
      userId,
      bookId,
      status: 'approved',
      chapters: chapterId
    });

    if (!approvedRequest) {
      return res.status(404).json({ message: 'No approved access found for the user and chapter' });
    }

    approvedRequest.chapters = approvedRequest.chapters.filter(id => id.toString() !== chapterId);
    
    if (approvedRequest.chapters.length === 0) {
      await ChapterAccessRequest.findByIdAndDelete(approvedRequest._id);
    } else {
      await approvedRequest.save();
    }

    res.json({ message: '✅ Chapter access revoked' });
  } catch (err) {
    console.error('Error revoking chapter access:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: Admin view - All approved user chapter accesses
router.get('/admin/access-management', async (req, res) => {
  try {
    const [approvedRequests, expiryAssignments] = await Promise.all([
      ChapterAccessRequest.find({ status: 'approved' })
        .populate('userId', 'name email')
        .populate('bookId', 'name chapters'),
      ChapterAssignment.find()
        .populate('userId', 'name email')
        .populate('bookId', 'name chapters')
    ]);

    const accessMap = new Map();

    // Process expiry-based assignments first (priority)
    expiryAssignments.forEach(assign => {
      const key = `${assign.userId._id}_${assign.bookId._id}_${assign.chapterId}`;
      accessMap.set(key, {
        type: 'expiry',
        chapterId: assign.chapterId,
        expiresAt: assign.expiresAt,
        bookId: assign.bookId._id,
        bookName: assign.bookId.name,
        chapterName: assign.bookId.chapters.find(ch => ch._id.toString() === assign.chapterId.toString())?.name || 'Unknown',
        user: assign.userId,
        accessId: assign._id
      });
    });

    // Process approved requests if not already overridden by expiry
    approvedRequests.forEach(req => {
      req.chapters.forEach(chId => {
        const key = `${req.userId._id}_${req.bookId._id}_${chId}`;
        if (!accessMap.has(key)) {
          const chapter = req.bookId?.chapters?.find(ch => ch._id.toString() === chId.toString());
          accessMap.set(key, {
            type: 'approved',
            chapterId: chId,
            bookId: req.bookId._id,
            bookName: req.bookId.name,
            chapterName: chapter?.name || 'Unknown',
            user: req.userId,
            accessId: req._id
          });
        }
      });
    });

    // Group by user
    const grouped = {};
    accessMap.forEach(access => {
      const uid = access.user._id;
      if (!grouped[uid]) {
        grouped[uid] = {
          user: access.user,
          chapters: []
        };
      }
      grouped[uid].chapters.push(access);
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("❌ Failed to load access-management:", err);
    res.status(500).json({ message: 'Server error while loading access data' });
  }
});




// DELETE: Admin revokes access for a chapter
// DELETE: Admin revokes access for a chapter////////////////////////////
router.delete('/admin/revoke-access/:accessId/:chapterId', async (req, res) => {
  try {
    const { accessId, chapterId } = req.params;
    const accessRequest = await ChapterAccessRequest.findById(accessId);
    if (!accessRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }

    const userId = accessRequest.userId;
    const book = await Book.findById(accessRequest.bookId);
    const chapter = book?.chapters.find(ch => ch._id.toString() === chapterId);

    if (accessRequest.chapters.length === 1 || !chapterId) {
      await ChapterAccessRequest.findByIdAndDelete(accessId);
    } else {
      accessRequest.chapters = accessRequest.chapters.filter(
        chId => chId.toString() !== chapterId
      );
      await accessRequest.save();
    }

    // 🔔 Send notification
    if (book && chapter) {
      const message = `❌ Access revoked for "${chapter.name}" in "${book.name}"`;
      await createNotification({ userId, type: 'revoked', message }, req);
    }

    res.json({ message: '✅ Access revoked' });
  } catch (err) {
    console.error("❌ Revoke access error:", err);
    res.status(500).json({ message: 'Server error while revoking access' });
  }
});


// Inside auth.js or a new assignments.js
const ChapterAssignment = require('../models/ChapterAssignment');

// POST /api/auth/admin/assign-chapters
router.post('/admin/assign-chapters', async (req, res) => {
  try {
    const { userId, bookId, chapters, durationDays } = req.body; // chapters = array of chapterIds

    if (!userId || !bookId || !Array.isArray(chapters) || chapters.length === 0 || !durationDays) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // ✅ Step 1: Remove approved access if exists for the same chapters
    await ChapterAccessRequest.updateMany(
      {
        userId,
        bookId,
        status: 'approved',
        chapters: { $in: chapters }
      },
      {
        $pull: { chapters: { $in: chapters } }
      }
    );

    // ✅ Step 2: Delete empty approved requests
    await ChapterAccessRequest.deleteMany({
      userId,
      bookId,
      status: 'approved',
      chapters: { $size: 0 }
    });

    // ✅ Step 3: Create expiry-based assignments
    const assignments = chapters.map(chapterId => ({
      userId,
      bookId,
      chapterId,
      assignedAt: now,
      expiresAt
    }));

    await ChapterAssignment.insertMany(assignments);

    // ✅ Step 4: Send Notifications to user per chapter
    const book = await Book.findById(bookId);

for (const chapterId of chapters) {
  const chapter = book.chapters.find(ch => ch._id.toString() === chapterId.toString());
  if (chapter) {
    const message = `📚 Chapter "${chapter.name}" from "${book.name}" assigned until ${expiresAt.toLocaleDateString()}`;
    await createNotification({ userId, type: 'assigned', message }, req);
  }
}
/////////////////////////////////////////////////////////////////////////////////

    res.status(201).json({ message: '✅ Chapters assigned successfully with expiry' });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ message: 'Server error while assigning chapters' });
  }
});




const ActivityLog = require('../models/ActivityLog');

// POST /api/auth/activity-log
router.post('/activity-log', async (req, res) => {
  try {
    const { bookId, chapterId, pageNum, duration } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    console.log('📥 Activity POST:', { userId, bookId, chapterId, pageNum, duration });
    let log = await ActivityLog.findOne({ userId, bookId, chapterId });

    if (!log) {
  log = new ActivityLog({
    userId,
    bookId,
    chapterId,
    pagesViewed: [pageNum],
    totalTimeSpent: duration,
    lastActive: new Date() // ✅ add this
  });
}
else {
      if (!log.pagesViewed.includes(pageNum)) {
        log.pagesViewed.push(pageNum);
      }
      log.totalTimeSpent += duration;
      log.lastActive = Date.now();
    }

    await log.save();
    console.log('✅ Activity saved:', log);
    res.json({ success: true, log });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ message: 'Failed to save activity log' });
  }
});




// 📁 GET: Admin - Get active student report
router.get('/admin/student-activity-report', async (req, res) => {
  try {
    const logs = await ActivityLog.aggregate([
      {
        $group: {
  _id: '$userId',
  totalViews: { $sum: { $size: "$pagesViewed" } },
  totalTime: { $sum: "$totalTimeSpent" },
  lastSeen: { $max: "$lastActive" },
}
,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalViews: 1,
          totalTime: 1,
          lastSeen: 1,
        },
      },
      {
        $sort: { lastSeen: -1 },
      },
    ]);

    res.json({ success: true, report: logs });
  } catch (err) {
    console.error('📉 Error generating activity report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET: Assigned books and chapters for a user
router.get('/user/assigned-books', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const assignments = await ChapterAssignment.find({ userId }).populate({
      path: 'bookId',
      select: 'name coverUrl chapters',
    }).lean(); // Use lean to simplify processing

    const bookMap = {};

    for (let assign of assignments) {
      const book = assign.bookId;
      if (!book || !book.chapters) continue;

      if (!bookMap[book._id]) {
        bookMap[book._id] = {
          _id: book._id,
          name: book.name,
          coverUrl: book.coverUrl,
          chapters: []
        };
      }

      const chapter = book.chapters.find(ch => ch._id.toString() === assign.chapterId.toString());
      if (chapter) {
        bookMap[book._id].chapters.push({
          _id: chapter._id,
          name: chapter.name,
          description: chapter.description,
          fromPage: chapter.fromPage,
          toPage: chapter.toPage,
          price: chapter.price,
          subchapters: chapter.subchapters || [],
          expiresAt: assign.expiresAt // ✅ Include this
        });
      }
    }

    const result = Object.values(bookMap);
    res.json({ success: true, books: result });
  } catch (err) {
    console.error('Assigned books error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// GET /api/auth/admin/all-users
router.get('/admin/all-users', async (req, res) => {
  try {
    const users = await User.find({}, 'email name'); // only return necessary fields
    res.json({ success: true, users });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


//DELETE: Admin revokes expiry-based chapter access
router.delete('/admin/revoke-expiry-access/:userId/:bookId/:chapterId', async (req, res) => {
  const { userId, bookId, chapterId } = req.params;
  try {
    const deleted = await ChapterAssignment.findOneAndDelete({ userId, bookId, chapterId });
    if (!deleted) return res.status(404).json({ message: 'No expiry-based access found' });

    // 🔔 Send notification
    const book = await Book.findById(bookId);
    const chapter = book?.chapters.find(ch => ch._id.toString() === chapterId);
    if (book && chapter) {
      const message = `⏳ Expiry-based access revoked for "${chapter.name}" in "${book.name}"`;
      await createNotification({ userId, type: 'revoked', message }, req);
    }

    res.json({ message: '✅ Expiry-based access revoked' });
  } catch (err) {
    console.error("Revoke expiry access error:", err);
    res.status(500).json({ message: 'Server error while revoking expiry-based access' });
  }
});

////////////////////////////////////////////
router.get('/user/notifications', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Notification fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/user/notifications/mark-read', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Notification mark-read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});















module.exports = router;




