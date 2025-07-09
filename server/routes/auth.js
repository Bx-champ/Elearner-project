const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
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

    // Handle chapters
    const existingMap = {};
    book.chapters.forEach(ch => existingMap[ch._id?.toString()] = ch);
    const updatedChapters = [];
    const deleteKeys = [];

    // ✅ Use for...of + await for proper async handling
    for (let idx = 0; idx < chaptersMeta.length; idx++) {
      const meta = chaptersMeta[idx];

      if (meta._id && existingMap[meta._id]) {
        // Existing chapter
        const ch = existingMap[meta._id];
        ch.name = meta.name;
        ch.description = meta.description;
        ch.price = meta.price;
        ch.order = idx;
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
          pdfUrl
        });
      }
    }

    // Handle deletions
    for (const ch of Object.values(existingMap)) {
      if (ch.pdfUrl) {
        deleteKeys.push({ Key: ch.pdfUrl.split('.com/')[1] });
      }
    }

    if (deleteKeys.length) {
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
      chapters: { $all: chapterIds },
      status: 'pending'
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

    res.status(201).json({ message: '✅ Access request submitted', request });
  } catch (err) {
    console.error('❌ Access request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;




