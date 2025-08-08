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
const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const ChapterAssignment = require('../models/ChapterAssignment');
const fetch = require('node-fetch');
const { PDFDocument } = require('pdf-lib');

// Imports for file system and running commands
const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// --- Import the authentication middleware ---
const verifyToken = require('../middlewares/verifyToken');


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
  // return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
   return `${process.env.CLOUDFRONT_DOMAIN}/${key}`;
};

// ... (createNotification, signin, signup routes remain the same)
const createNotification = async ({ userId, message, type, forAdmin = false }, req = null) => {
  try {
    const notification = await new Notification({
      userId: forAdmin ? undefined : userId,
      message,
      type,
      forAdmin
    }).save();

    if (req && !forAdmin) {
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

    if (role === 'user') {
      await User.findByIdAndUpdate(user._id, { currentToken: token });
    } else if (role === 'admin') {
      // Assuming Admin model has currentToken field
      await Admin.findByIdAndUpdate(user._id, { currentToken: token });
    } else if (role === 'vendor') {
      // Assuming Vendor model has currentToken field
      await Vendor.findByIdAndUpdate(user._id, { currentToken: token });
    }

    const userInfo = { _id: user._id, name: user.name, email: user.email };
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


// ==================== BOOK UPDATE ROUTE WITH PROGRESS BAR ====================
// ==================== CORRECTED PARALLEL BOOK UPDATE ROUTE ====================
router.put('/admin/book/:id', upload.any(), async (req, res) => {
  const tempDir = path.join(__dirname, '..', 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  try {
    const { name, subject, tags, contents } = req.body;
    const chaptersMeta = JSON.parse(req.body.chapters);
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // --- Handle cover ---
    const coverFile = req.files.find(f => f.fieldname === 'cover');
    if (coverFile) {
      if (book.coverUrl) {
        if (book.coverUrl) {
  // const match = book.coverUrl.match(/\.com\/(.+)/);
  const match = book.coverUrl.match(/https?:\/\/[^/]+\/(.+)/);

  const coverKey = match ? match[1] : null;

  if (coverKey) {
    await s3.send(new DeleteObjectsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: { Objects: [{ Key: coverKey }] }
    }));
  } else {
    console.warn('⚠️ Could not extract key from coverUrl:', book.coverUrl);
  }
}


      }
      const coverKey = `books/${Date.now()}-${coverFile.originalname}`;
      book.coverUrl = await uploadFileToS3(coverFile.buffer, coverKey, coverFile.mimetype);
    }

    const existingMap = {};
    book.chapters.forEach(ch => existingMap[ch._id?.toString()] = ch);
    const updatedChapters = [];
    const deleteKeys = [];

    let mainPdfDoc = null;

    for (let idx = 0; idx < chaptersMeta.length; idx++) {
      const meta = chaptersMeta[idx];
      const sanitizedSubchapters = (meta.subchapters || []).filter(sub =>
        sub.name && sub.fromPage != null && sub.toPage != null
      );

      if (meta._id && existingMap[meta._id]) {
        // --- Existing chapter ---
        const ch = existingMap[meta._id];
        ch.name = meta.name;
        ch.description = meta.description;
        ch.price = meta.price;
        ch.order = idx;
        ch.fromPage = meta.fromPage;
        ch.toPage = meta.toPage;
        ch.subchapters = sanitizedSubchapters;
        updatedChapters.push(ch);
        delete existingMap[meta._id];
      } else {
        // --- New chapter ---
        let pdfUrl = '';

        // Try split from main book PDF
        if (!mainPdfDoc) {
          const pdfResponse = await fetch(book.pdfUrl);
          const mainPdfBytes = await pdfResponse.arrayBuffer();
          mainPdfDoc = await PDFDocument.load(mainPdfBytes, { ignoreEncryption: true });
        }

        const fromPage = Number(meta.fromPage);
        const toPage = Number(meta.toPage);
        if (fromPage <= 0 || toPage > mainPdfDoc.getPageCount() || fromPage > toPage) {
          return res.status(400).json({ message: `Invalid page range for "${meta.name}"` });
        }

        const chapterPdfDoc = await PDFDocument.create();
        const copiedPages = await chapterPdfDoc.copyPages(mainPdfDoc, Array.from({ length: toPage - fromPage + 1 }, (_, i) => fromPage - 1 + i));
        copiedPages.forEach(page => chapterPdfDoc.addPage(page));
        const chapterPdfBytes = await chapterPdfDoc.save();

        const tempInputPath = path.join(tempDir, `input-${Date.now()}-${idx}.pdf`);
        const tempOutputPath = path.join(tempDir, `output-${Date.now()}-${idx}.pdf`);
        await fs.writeFile(tempInputPath, chapterPdfBytes);

        // const qpdfCommand = '"D:\\qpdfff\\qpdf-12.2.0-mingw64\\bin\\qpdf.exe"';
        const qpdfCommand = 'qpdf';
        await execPromise(`${qpdfCommand} --linearize "${tempInputPath}" "${tempOutputPath}"`);

        const linearizedPdfBuffer = await fs.readFile(tempOutputPath);
        const chapterKey = `books/chapters/${book._id}/${meta.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        pdfUrl = await uploadFileToS3(linearizedPdfBuffer, chapterKey, 'application/pdf');

        updatedChapters.push({
          _id: new mongoose.Types.ObjectId(),
          name: meta.name,
          description: meta.description,
          price: meta.price,
          order: idx,
          pdfUrl,
          fromPage,
          toPage,
          subchapters: sanitizedSubchapters
        });
      }
    }

    // --- Delete removed chapters ---
    for (const ch of Object.values(existingMap)) {
      if (ch.pdfUrl) {
        // deleteKeys.push({ Key: ch.pdfUrl.split('.com/')[1] });
        const key = ch.pdfUrl?.split('.com/')[1];
        if (key) deleteKeys.push({ Key: key });

      }
    }

    if (deleteKeys.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: deleteKeys }
      }));
    }

    // --- Final update ---
    book.name = name;
    book.subject = subject;
    book.tags = tags;
    book.contents = contents;
    book.chapters = updatedChapters;
    book.price = updatedChapters.reduce((sum, ch) => sum + Number(ch.price || 0), 0);

    await book.save();
    res.json({ message: '✅ Book updated successfully', book });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: '❌ Update failed', error: err.message });
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Failed to cleanup temp directory:", cleanupError);
    }
  }
});

// ✅ --- NEW ROUTE TO DELETE A CHAPTER ---
router.delete('/admin/book/:bookId/chapter/:chapterId', verifyToken, async (req, res) => {
    try {
        const { bookId, chapterId } = req.params;
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        const chapterIndex = book.chapters.findIndex(ch => ch._id.toString() === chapterId);
        if (chapterIndex === -1) {
            return res.status(404).json({ message: 'Chapter not found' });
        }

        const chapterToDelete = book.chapters[chapterIndex];

        // 1. Delete the chapter's PDF from AWS S3 if it exists
        if (chapterToDelete.pdfUrl) {
            const key = chapterToDelete.pdfUrl.split('.com/')[1];
            await s3.send(new DeleteObjectsCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: { Objects: [{ Key: key }] }
            }));
        }

        // 2. Remove the chapter from the book's array
        book.chapters.splice(chapterIndex, 1);

        // 3. Save the updated book document
        await book.save();

        res.json({ message: 'Chapter deleted successfully', book });

    } catch (err) {
        console.error('Chapter delete error:', err);
        res.status(500).json({ message: 'Failed to delete chapter', error: err.message });
    }
});


// ... (The rest of your routes, like /book/:bookId/chapter/:chapterId, etc., remain unchanged)
router.get('/book/:bookId/chapter/:chapterId', async (req, res) => {
  try {
    const { bookId, chapterId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const chapter = book.chapters.id(chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    const adjustedSubchapters = (chapter.subchapters || []).map(sub => ({
        name: sub.name,
        fromPage: sub.fromPage - chapter.fromPage + 1,
        toPage: sub.toPage - chapter.fromPage + 1,
    }));

    res.json({
      pdfUrl: chapter.pdfUrl,
      fromPage: 1,
      toPage: chapter.toPage - chapter.fromPage + 1,
      name: chapter.name,
      description: chapter.description,
      subchapters: adjustedSubchapters
    });
  } catch (err) {
    console.error('Error fetching chapter preview:', err);
    res.status(500).json({ message: 'Failed to load chapter preview' });
  }
});

router.post('/request-access', async (req, res) => {
  try {
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

    const book = await Book.findById(bookId);
    const chapterNames = book.chapters
      .filter(ch => chapterIds.includes(ch._id.toString()))
      .map(ch => ch.name);

    const message = `📝 Request submitted for book "${book.name}" - chapters: ${chapterNames.join(', ')}`;
    await createNotification({ userId, type: 'requestSubmitted', message }, req);

    const user = await User.findById(userId);
    await createNotification({
      message: `📨 Access request from "${user.name}" (${user.email}) for "${book.name}" - Chapters: ${chapterNames.join(', ')}`,
      type: 'userRequest',
      forAdmin: true
    });

    res.status(201).json({ message: '✅ Access request submitted', request });
  } catch (err) {
    console.error('❌ Access request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/access-requests', async (req, res) => {
  try {
    const requests = await ChapterAccessRequest.find()
      .populate('userId', 'name email')
      .populate('bookId', 'name chapters')
      .lean()
      .sort({ requestedAt: -1 });

    const transformed = requests.map(req => {
      if (!req.bookId || !req.bookId.chapters) return null;
      const chapterDetails = req.chapters.map(chId => {
        const found = req.bookId.chapters.find(ch => ch._id.toString() === chId.toString());
        return found ? found.name : 'Unknown Chapter';
      });

      return { ...req, chapterNames: chapterDetails };
    }).filter(Boolean);

    res.json({ success: true, requests: transformed });
  } catch (err) {
    console.error('Error fetching access requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

    const book = await Book.findById(request.bookId);
    const chapterNames = book.chapters
      .filter(ch => request.chapters.includes(ch._id.toString()))
      .map(ch => ch.name);

    const message = `✅ Access ${status.toUpperCase()} for "${book.name}" - chapters: ${chapterNames.join(', ')}`;
    await createNotification({ userId: request.userId, type: status, message }, req);

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


////////////////////////////////////////////////////////////////////////////////////////
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
      if (!assign.userId || !assign.bookId || !assign.chapterId) return;

      const key = `${assign.userId._id}_${assign.bookId._id}_${assign.chapterId}`;
      const chapter = assign.bookId.chapters.find(
        ch => ch._id.toString() === assign.chapterId.toString()
      );

      accessMap.set(key, {
        type: 'expiry',
        chapterId: assign.chapterId,
        expiresAt: assign.expiresAt,
        bookId: assign.bookId._id,
        bookName: assign.bookId.name,
        chapterName: chapter?.name || 'Unknown',
        user: assign.userId,
        accessId: assign._id
      });
    });

    // Process approved requests if not already overridden by expiry
    approvedRequests.forEach(req => {
      if (!req.userId || !req.bookId || !req.chapters) return;

      req.chapters.forEach(chId => {
        const key = `${req.userId._id}_${req.bookId._id}_${chId}`;
        if (!accessMap.has(key)) {
          const chapter = req.bookId.chapters.find(
            ch => ch._id.toString() === chId.toString()
          );

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


router.delete('/admin/revoke-access/:accessId/:chapterId', async (req, res) => {
  try {
    const { accessId, chapterId } = req.params;
    const accessRequest = await ChapterAccessRequest.findById(accessId);
    if (!accessRequest) {
      const deleted = await ChapterAssignment.findOneAndDelete({ _id: accessId, chapterId: chapterId });
       if (!deleted) return res.status(404).json({ message: 'No access found' });
    } else {
        accessRequest.chapters = accessRequest.chapters.filter(
          chId => chId.toString() !== chapterId
        );
        if (accessRequest.chapters.length === 0) {
            await ChapterAccessRequest.findByIdAndDelete(accessId);
        } else {
            await accessRequest.save();
        }
    }

    res.json({ message: '✅ Access revoked' });
  } catch (err) {
    console.error("❌ Revoke access error:", err);
    res.status(500).json({ message: 'Server error while revoking access' });
  }
});

router.post('/admin/assign-chapters', async (req, res) => {
  try {
    const { userId, bookId, chapters, durationDays } = req.body;

    if (!userId || !bookId || !Array.isArray(chapters) || chapters.length === 0 || !durationDays) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await ChapterAccessRequest.updateMany(
      { userId, bookId, status: 'approved', chapters: { $in: chapters } },
      { $pull: { chapters: { $in: chapters } } }
    );

    await ChapterAccessRequest.deleteMany({ userId, bookId, status: 'approved', chapters: { $size: 0 } });

    const assignments = chapters.map(chapterId => ({
      userId,
      bookId,
      chapterId,
      assignedAt: now,
      expiresAt
    }));

    await ChapterAssignment.insertMany(assignments);

    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    for (const chapterId of chapters) {
      const chapter = book.chapters.find(ch => ch._id.toString() === chapterId.toString());
      if (chapter) {
        const messageToUser = `📚 Chapter "${chapter.name}" from "${book.name}" assigned until ${expiresAt.toLocaleDateString()}`;
        await createNotification({ userId, type: 'assigned', message: messageToUser }, req);

        const messageToAdmin = `🛡️ Assigned chapter "${chapter.name}" from "${book.name}" to user "${user.name}" (${user.email}) until ${expiresAt.toLocaleDateString()}`;
        await createNotification({ message: messageToAdmin, type: 'assigned', forAdmin: true });
      }
    }

    res.status(201).json({ message: '✅ Chapters assigned successfully with expiry' });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ message: 'Server error while assigning chapters' });
  }
});

router.post('/activity-log', async (req, res) => {
  try {
    const { bookId, chapterId, pageNum, duration } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    let log = await ActivityLog.findOne({ userId, bookId, chapterId });

    if (!log) {
      log = new ActivityLog({
        userId,
        bookId,
        chapterId,
        pagesViewed: [pageNum],
        totalTimeSpent: duration,
        lastActive: new Date()
      });
    } else {
      if (!log.pagesViewed.includes(pageNum)) {
        log.pagesViewed.push(pageNum);
      }
      log.totalTimeSpent += duration;
      log.lastActive = Date.now();
    }

    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    console.error('Activity log error:', err);
    res.status(500).json({ message: 'Failed to save activity log' });
  }
});

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
            }
        ]);

        const userIdsWithActivity = logs.map(log => log._id);
        const users = await User.find({ _id: { $in: userIdsWithActivity } }).lean();

        const logMap = new Map(logs.map(log => [log._id.toString(), log]));

        const report = users.map(user => {
            const log = logMap.get(user._id.toString());
            return {
                userId: user._id,
                name: user.name,
                email: user.email,
                totalViews: log?.totalViews || 0,
                totalTime: log?.totalTime || 0,
                lastSeen: log?.lastSeen || null,
            };
        });

        res.json({ success: true, report });
    } catch (err) {
        console.error('📉 Error generating activity report:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



// GET: Assigned books and chapters for a user///////////////////////////////////
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


/////////////////////////////////////////////////////////////////////////////////////////
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




////////////////////////////////////////////////////////////////////////////////////////////////
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

router.get('/admin/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ forAdmin: true }).sort({ createdAt: -1 });
        res.json({ success: true, notifications });
    } catch (err) {
        console.error('Admin notification fetch error:', err);
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

router.put('/admin/notifications/mark-read', async (req, res) => {
    try {
        await Notification.updateMany({ forAdmin: true, isRead: false }, { $set: { isRead: true } });
        res.json({ success: true, message: 'Admin notifications marked as read' });
    } catch (err) {
        console.error('Admin mark-read error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



// GET /api/auth/user/activity-summary/////////////////////////////////////////////////////
router.get('/user/activity-summary', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const summary = await ActivityLog.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$userId',
          totalViews: { $sum: { $size: '$pagesViewed' } },
          totalTime: { $sum: '$totalTimeSpent' },
          lastSeen: { $max: '$lastActive' }
        }
      }
    ]);

    res.json({ success: true, summary: summary[0] || {} });
  } catch (err) {
    console.error('Activity summary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(400).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let model;

    if (decoded.role === 'user') model = User;
    else if (decoded.role === 'admin') model = Admin;
    else if (decoded.role === 'vendor') model = Vendor;
    else return res.status(400).json({ message: 'Invalid role' });

    await model.findByIdAndUpdate(decoded.id, { currentToken: null });
    res.json({ message: '✅ Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error during logout' });
  }
});





router.get('/admin/user-stats', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [today, week, year, recentUsers] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      User.countDocuments({ createdAt: { $gte: yearStart } }),
      User.find().sort({ createdAt: -1 }).limit(10).select('name email createdAt')
    ]);

    res.json({ today, week, year, recentUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});


router.get('/admin/platform-stats', async (req, res) => {
  try {
    const [bookCount, books, loggedInUsers, onlineUsersFromUser, onlineUsersFromActivity] = await Promise.all([
      Book.countDocuments(),
      Book.find({}, 'chapters'),
      User.countDocuments({ currentToken: { $ne: null } }),
      User.countDocuments({ isOnline: true }),
      ActivityLog.distinct('userId', { isOnline: true }),
    ]);

    // Calculate total chapters
    const totalChapters = books.reduce((sum, book) => sum + (book.chapters?.length || 0), 0);

    // Merge unique online users from both User and ActivityLog
    const onlineUserSet = new Set();
    onlineUsersFromActivity.forEach(id => onlineUserSet.add(String(id)));
    const totalOnlineUsers = onlineUserSet.size > onlineUsersFromUser ? onlineUserSet.size : onlineUsersFromUser;

    res.json({
      totalBooks: bookCount,
      totalChapters,
      loggedInUsers,
      onlineUsers: totalOnlineUsers,
    });
  } catch (err) {
    console.error('Error fetching platform stats:', err);
    res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
});


// Add this new route to auth.js
router.put('/user/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the old password is correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect old password.' });
    }

    // Hash the new password and save it
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: '✅ Password updated successfully!' });

  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
});


// Add this new route to auth.js
router.get('/user/pending-requests', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pending = await ChapterAccessRequest.find({ userId, status: 'pending' })
            .populate('bookId', 'name')
            .lean();

        const transformed = pending.map(req => ({
            bookName: req.bookId.name,
            chapters: req.chapters, // Chapter IDs, can be populated further if needed
            status: req.status,
            requestedAt: req.requestedAt
        }));

        res.json({ success: true, pending: transformed });

    } catch (err) {
        console.error('Error fetching user pending requests:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


// Add this new route to auth.js

// GET /api/auth/user/last-activity
// Replace the old /user/last-activity route in auth.js with this corrected version

router.get('/user/last-activity', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const lastLog = await ActivityLog.findOne({ userId })
            .sort({ lastActive: -1 })
            .populate({
                path: 'bookId',
                select: 'name chapters'
            })
            .lean();

        // ===== FIX IS HERE =====
        // Check if a log AND its associated book exist before proceeding.
        if (!lastLog || !lastLog.bookId) {
            return res.json({ success: true, data: null });
        }

        // Find the specific chapter from the populated book
        const chapter = lastLog.bookId.chapters.find(
            ch => ch._id.toString() === lastLog.chapterId.toString()
        );

        res.json({
            success: true,
            data: {
                bookId: lastLog.bookId._id,
                bookName: lastLog.bookId.name,
                chapterId: lastLog.chapterId,
                chapterName: chapter ? chapter.name : 'Unknown Chapter',
                lastActive: lastLog.lastActive
            }
        });
    } catch (err) {
        console.error('Error fetching last activity:', err);
        res.status(500).json({ message: 'Server error while fetching last activity' });
    }
});

// Add this new route to your auth.js file

router.put('/user/update-details', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name: name.trim() },
            { new: true } // This option returns the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: '✅ Profile updated successfully!',
            user: { name: updatedUser.name } // Send back the updated name
        });

    } catch (err) {
        console.error('User update error:', err);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});


module.exports = router;
