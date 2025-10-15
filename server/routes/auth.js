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
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Built-in Node.js module
const sgMail = require('@sendgrid/mail');
// Imports for file system and running commands
const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
// const { sendPhoneOtp } = require('../utils/twilio'); 

// --- Import the authentication middleware ---
const verifyToken = require('../middlewares/verifyToken');


require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const router = express.Router();

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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

/////////////////////////////
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendPhoneOtp = async (phone, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return message.sid;
  } catch (err) {
    console.error('Twilio error:', err);
    throw new Error('Failed to send OTP');
  }
};




// router.post('/signup', async (req, res) => {
//   const { name, email, password } = req.body;
//   try {
//     if (await User.findOne({ email })) {
//         return res.status(400).json({ message: 'An account with this email already exists.' });
//     }
    
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationToken = crypto.randomBytes(32).toString('hex');
//     const verificationExpires = Date.now() + 3600000; // Token expires in 1 hour

//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       emailVerificationToken: verificationToken,
//       emailVerificationExpires: verificationExpires,
//     });

//     await newUser.save();

//     // --- Send Verification Email using SendGrid ---
//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
//     const msg = {
//       to: newUser.email,
//       from: 'admin@zenithile.com', // IMPORTANT: Use a verified sender from your SendGrid account
//       templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
//       dynamic_template_data: {
//         name: newUser.name,
//         verificationUrl: verificationUrl,
//       },
//     };

//     await sgMail.send(msg);

//     res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });

//   } catch (err) {
//     console.error('Signup Error:', err);
//     if (err.response) {
//       console.error('SendGrid Error Body:', err.response.body)
//     }
//     res.status(500).json({ message: 'Server error during registration.' });
//   }
// });

router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Check for existing user by email or phone
    if (await User.findOne({ $or: [{ email }, { phone }] })) {
      return res.status(400).json({ message: 'An account with this email or phone number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 3600000; // 1 hour

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    await newUser.save();

    // SendGrid verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const msg = {
      to: newUser.email,
      from: 'admin@zenithile.com',
      templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
      dynamic_template_data: {
        name: newUser.name,
        verificationUrl,
      },
    };

    await sgMail.send(msg);

    res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });

  } catch (err) {
    console.error('Signup Error:', err);
    if (err.response) console.error('SendGrid Error Body:', err.response.body);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});





// router.post('/signup', async (req, res) => {
//   const { name, email, password, phone } = req.body;
//   if (!name || !email || !password || !phone) {
//     return res.status(400).json({ message: 'Name, email, password, and phone are required.' });
//   }

//   try {
//     // Check if email already exists
//     if (await User.findOne({ email })) {
//       return res.status(400).json({ message: 'Email already registered.' });
//     }

//     // Check if phone OTP was verified
//     const phoneOtp = await PhoneOtp.findOne({ phone });
//     if (phoneOtp) {
//       return res.status(400).json({ message: 'Please verify your phone before signing up.' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationToken = crypto.randomBytes(32).toString('hex');
//     const verificationExpires = Date.now() + 3600000;

//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       isPhoneVerified: true,
//       emailVerificationToken: verificationToken,
//       emailVerificationExpires: verificationExpires
//     });

//     await newUser.save();

//     const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
//     const msg = {
//       to: email,
//       from: 'admin@zenithile.com',
//       templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
//       dynamic_template_data: { name, verificationUrl }
//     };
//     await sgMail.send(msg);

//     res.status(201).json({ message: 'Registration successful! Please check your email.' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error during registration.' });
//   }
// });




// ///////////////////////////////////////////////

// const PhoneOtp = require('../models/PhoneOtp');

// router.post('/send-phone-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) return res.status(400).json({ message: 'Phone is required' });

//   try {
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expires = Date.now() + 5 * 60 * 1000; // 5 min

//     let phoneOtp = await PhoneOtp.findOne({ phone });
//     if (!phoneOtp) {
//       phoneOtp = new PhoneOtp({ phone, otp, expires });
//     } else {
//       phoneOtp.otp = otp;
//       phoneOtp.expires = expires;
//     }
//     await phoneOtp.save();

//     await sendPhoneOtp(phone, otp); // Twilio helper

//     res.json({ message: 'OTP sent to your phone' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to send OTP' });
//   }
// });



// router.post('/verify-phone-otp', async (req, res) => {
//   const { phone, otp } = req.body;

//   try {
//     const phoneOtp = await PhoneOtp.findOne({ phone });
//     if (!phoneOtp) return res.status(404).json({ message: 'OTP not found' });
//     if (phoneOtp.otp !== otp || phoneOtp.expires < Date.now())
//       return res.status(400).json({ message: 'Invalid or expired OTP' });

//     // Mark OTP as verified (can delete it)
//     await PhoneOtp.deleteOne({ phone });

//     res.json({ message: 'Phone verified successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Find the user with the matching, unexpired token
        let user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        // 2. If no user is found with the token, it might be because they are already verified.
        // Let's check for a user who had this token but it has since been cleared.
        if (!user) {
            // Find user by the token, but ignore expiration.
            const expiredOrUsedTokenUser = await User.findOne({ emailVerificationToken: token });

            // If we find a user and they are already verified, it's a success.
            if (expiredOrUsedTokenUser && expiredOrUsedTokenUser.isVerified) {
                return res.json({ message: 'Email has already been verified. You can now log in.' });
            }
            
            // Otherwise, the token is truly invalid.
            return res.status(400).json({ message: 'Verification token is invalid or has expired.' });
        }

        // 3. If we found the user, verify them.
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        
        res.json({ message: 'Email verified successfully! You can now log in.' });

    } catch (err) {
        console.error('Email Verification Error:', err);
        res.status(500).json({ message: 'An error occurred during email verification.' });
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

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user, role;
    user = await Admin.findOne({ email });
    if (user) role = 'admin';
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Check if the user's email is verified
        if (!user.isVerified) {
              return res.status(403).json({ message: 'Please verify your email address before logging in.' });
          }
        role = 'user';
      }
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
      await User.findByIdAndUpdate(user._id, { currentToken: token , isOnline: true  });
    } else if (role === 'admin') {
      await Admin.findByIdAndUpdate(user._id, { currentToken: token , isOnline: true });
    } else if (role === 'vendor') {
      await Vendor.findByIdAndUpdate(user._id, { currentToken: token , isOnline: true });
    }

    const userInfo = { _id: user._id, name: user.name, email: user.email, token };
    
    res.json({ role, user: userInfo, message: `${role} login success` });

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
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const deleteObjects = [];

    // ✅ --- THE FIX: A more robust function ---
    const getKeyFromUrl = (urlString) => {
      if (!urlString) return null;
      try {
        const path = new URL(urlString).pathname.substring(1);
        // Ensure the key is not an empty string and decode URL-encoded characters (like %20 for space)
        return path ? decodeURIComponent(path) : null;
      } catch (e) {
        console.error('Invalid URL for S3 key extraction:', urlString);
        return null;
      }
    };

    const coverKey = getKeyFromUrl(book.coverUrl);
    if (coverKey) {
      deleteObjects.push({ Key: coverKey });
    }

    book.chapters.forEach(ch => {
      const chapterKey = getKeyFromUrl(ch.pdfUrl);
      if (chapterKey) {
        deleteObjects.push({ Key: chapterKey });
      }
    });

    // --- Add this console.log for debugging ---
    console.log('Attempting to delete these S3 objects:', JSON.stringify(deleteObjects, null, 2));

    if (deleteObjects.length > 0) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Delete: { Objects: deleteObjects }
      }));
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Book and associated files deleted successfully' });

  } catch (err) {
    console.error('❌ Full delete error:', err); 
    res.status(500).json({ success: false, message: 'Delete failed on the server.' });
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










////////////////////////old code///////////////below/////////////////////////////////////////////////////////
// router.post('/request-access', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'No token provided' });

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(401).json({ message: 'Invalid token' });
//     }

//     const userId = decoded.id;
//     const { bookId, chapterIds } = req.body;

//     if (!userId || !bookId || !Array.isArray(chapterIds) || chapterIds.length === 0) {
//       return res.status(400).json({ message: 'Invalid request payload' });
//     }

//     const existingRequest = await ChapterAccessRequest.findOne({
//       userId,
//       bookId,
//       status: 'pending',
//       chapters: { $in: chapterIds }
//     });

//     if (existingRequest) {
//       return res.status(409).json({ message: 'Already requested access for selected chapters' });
//     }

//     const request = new ChapterAccessRequest({
//       userId,
//       bookId,
//       chapters: chapterIds
//     });

//     await request.save();

//     const book = await Book.findById(bookId);
//     const chapterNames = book.chapters
//       .filter(ch => chapterIds.includes(ch._id.toString()))
//       .map(ch => ch.name);

//     const message = `📝 Request submitted for book "${book.name}" - chapters: ${chapterNames.join(', ')}`;
//     await createNotification({ userId, type: 'requestSubmitted', message }, req);

//     const user = await User.findById(userId);
//     await createNotification({
//       message: `📨 Access request from "${user.name}" (${user.email}) for "${book.name}" - Chapters: ${chapterNames.join(', ')}`,
//       type: 'userRequest',
//       forAdmin: true
//     });

//     res.status(201).json({ message: '✅ Access request submitted', request });
//   } catch (err) {
//     console.error('❌ Access request error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });




// router.get('/admin/access-requests', async (req, res) => {
//   try {
//     const requests = await ChapterAccessRequest.find()
//       .populate('userId', 'name email')
//       .populate('bookId', 'name chapters')
//       .lean()
//       .sort({ requestedAt: -1 });

//     const transformed = requests.map(req => {
//       if (!req.bookId || !req.bookId.chapters) return null;
//       const chapterDetails = req.chapters.map(chId => {
//         const found = req.bookId.chapters.find(ch => ch._id.toString() === chId.toString());
//         return found ? found.name : 'Unknown Chapter';
//       });

//       return { ...req, chapterNames: chapterDetails };
//     }).filter(Boolean);

//     res.json({ success: true, requests: transformed });
//   } catch (err) {
//     console.error('Error fetching access requests:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



// router.put('/admin/access-request-status', async (req, res) => {
//   try {
//     const { requestId, status } = req.body;
//     if (!['approved', 'rejected'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status' });
//     }

//     const request = await ChapterAccessRequest.findById(requestId);
//     if (!request) return res.status(404).json({ message: 'Request not found' });

//     request.status = status;
//     await request.save();

//     const book = await Book.findById(request.bookId);
//     const chapterNames = book.chapters
//       .filter(ch => request.chapters.includes(ch._id.toString()))
//       .map(ch => ch.name);

//     const message = `✅ Access ${status.toUpperCase()} for "${book.name}" - chapters: ${chapterNames.join(', ')}`;
//     await createNotification({ userId: request.userId, type: status, message }, req);

//     res.json({ message: `✅ Request ${status}` });
//   } catch (err) {
//     console.error('Status update error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


/////////////////////////////////new code //////////////////////////////////////////////////////////////

router.post('/request-access', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { bookId, chapterIds } = req.body;

    if (!userId || !bookId || !Array.isArray(chapterIds) || chapterIds.length === 0)
      return res.status(400).json({ message: 'Invalid request payload' });

    // Create per-chapter objects
    const chapters = chapterIds.map(id => ({ chapterId: id, status: 'pending' }));

    const request = new ChapterAccessRequest({ userId, bookId, chapters });
    await request.save();

    const book = await Book.findById(bookId);
    const chapterNames = book.chapters
      .filter(ch => chapterIds.includes(ch._id.toString()))
      .map(ch => ch.name);

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

      const chapters = req.chapters.map(chObj => {
        const chapterId = chObj.chapterId?.toString?.();
        const status = chObj.status || 'pending';
        const found = req.bookId.chapters.find(ch => ch._id?.toString() === chapterId);

        return {
          chapterId,
          name: found?.name || 'Unknown Chapter',
          status,
        };
      });

      return { ...req, chapters };
    }).filter(Boolean);

    res.json({ success: true, requests: transformed });
  } catch (err) {
    console.error('Error fetching access requests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/admin/access-request-status', async (req, res) => {
  try {
    const { requestId, chapterId, status } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const request = await ChapterAccessRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const chapter = request.chapters.find(ch => ch.chapterId === chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found in request' });

    chapter.status = status;

    // Update overall request status
    if (request.chapters.every(ch => ch.status === 'approved')) request.status = 'approved';
    else if (request.chapters.every(ch => ch.status === 'rejected')) request.status = 'rejected';
    else request.status = 'pending';

    await request.save();

    const book = await Book.findById(request.bookId);
    const chapterName = book.chapters.find(ch => ch._id.toString() === chapterId)?.name || 'Unknown';

    const message = `✅ Access ${status.toUpperCase()} for "${book.name}" - Chapter: ${chapterName}`;
    await createNotification({ userId: request.userId, type: status, message }, req);

    res.json({ message: `✅ Chapter ${status}` });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// router.put('/admin/access-request/:requestId/chapter/:chapterId', async (req, res) => {
//   try {
//     const { requestId, chapterId } = req.params;
//     const { status } = req.body;

//     if (!['approved', 'rejected'].includes(status))
//       return res.status(400).json({ message: 'Invalid status value' });

//     const request = await ChapterAccessRequest.findById(requestId);
//     if (!request) return res.status(404).json({ message: 'Access request not found' });

//     const chapter = request.chapters.find(c => c.chapterId === chapterId);
//     if (!chapter)
//       return res.status(404).json({ message: 'Chapter not found in request' });

//     // Update status
//     chapter.status = status;

//     // Update request-level status
//     if (request.chapters.every(ch => ch.status === 'approved'))
//       request.status = 'approved';
//     else if (request.chapters.every(ch => ch.status === 'rejected'))
//       request.status = 'rejected';
//     else request.status = 'pending';

//     await request.save();

//     res.json({ success: true, message: `Chapter ${status} successfully.` });
//   } catch (error) {
//     console.error('Error updating chapter access:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });




// router.put('/admin/access-request/:requestId/chapter/:chapterId', async (req, res) => {
//   try {
//     const { requestId, chapterId } = req.params;
//     const { status } = req.body;

//     if (!['approved', 'rejected'].includes(status))
//       return res.status(400).json({ message: 'Invalid status value' });

//     const request = await ChapterAccessRequest.findById(requestId);
//     if (!request) return res.status(404).json({ message: 'Access request not found' });

//     const chapter = request.chapters.find(c => c.chapterId === chapterId);
//     if (!chapter)
//       return res.status(404).json({ message: 'Chapter not found in request' });

//     // Update status for the selected chapter
//     chapter.status = status;

//     // Update global request status
//     if (request.chapters.every(ch => ch.status === 'approved')) request.status = 'approved';
//     else if (request.chapters.every(ch => ch.status === 'rejected')) request.status = 'rejected';
//     else request.status = 'pending';

//     await request.save();

//     // If approved, persist the chapter access
//     if (status === 'approved') {
//       const { userId, bookId } = request;

//       // Avoid duplicate access creation
//       const existingAccess = await ChapterAssignment.findOne({ userId, bookId, chapterId });
//       if (!existingAccess) {
//         const newAccess = new ChapterAssignment({
//           userId,
//           bookId,
//           chapterId,
//           assignedAt: new Date(),
//           expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // optional 1 year expiry
//         });
//         await newAccess.save();
//       }
//     }

//     res.json({ success: true, message: `Chapter ${status} successfully.` });
//   } catch (error) {
//     console.error('Error updating chapter access:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



router.put('/admin/access-request/:requestId/chapter/:chapterId', async (req, res) => {
  try {
    const { requestId, chapterId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status value' });

    const request = await ChapterAccessRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Access request not found' });

    const chapter = request.chapters.find(c => c.chapterId === chapterId);
    if (!chapter)
      return res.status(404).json({ message: 'Chapter not found in request' });

    // ✅ Only update status in ChapterAccessRequest
    chapter.status = status;

    // Update request-level status
    if (request.chapters.every(ch => ch.status === 'approved'))
      request.status = 'approved';
    else if (request.chapters.every(ch => ch.status === 'rejected'))
      request.status = 'rejected';
    else request.status = 'pending';

    await request.save();

    res.json({ success: true, message: `Chapter ${status} successfully.` });
  } catch (error) {
    console.error('Error updating chapter access:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




////////////////////////////////////////////////////////////////////////////////////////////////////////





// router.get('/user/chapter-access/all', verifyToken(), async (req, res) => {
//   try {
//     const userId = req.user.id; // Now correctly get userId from middleware
//     const approvedRequests = await ChapterAccessRequest.find({ userId, status: 'approved' })
//       .populate({ path: 'bookId', select: 'name coverUrl chapters' }).lean();

//     const bookMap = {};
//     approvedRequests.forEach(req => {
//       const book = req.bookId;
//       if (!book || !book.chapters) return;
//       if (!bookMap[book._id]) {
//         bookMap[book._id] = { _id: book._id, name: book.name, coverUrl: book.coverUrl, chapters: [] };
//       }
//       req.chapters.forEach(chId => {
//         const chapter = book.chapters.find(c => c._id.toString() === chId.toString());
//         if (chapter) { bookMap[book._id].chapters.push(chapter); }
//       });
//     });

//     res.json({ success: true, books: Object.values(bookMap) });
//   } catch (err) {
//     console.error('❌ Error in /user/chapter-access/all:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



router.get('/user/chapter-access/all', verifyToken(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch approved requests
    const approvedRequests = await ChapterAccessRequest.find({ userId })
      .populate('bookId', 'name coverUrl chapters')
      .lean();

    // Fetch expiry-based assignments
    const expiryAssignments = await ChapterAssignment.find({ userId })
      .populate('bookId', 'name coverUrl chapters')
      .lean();

    const bookMap = {};

    // Process expiry-based assignments first (priority)
    expiryAssignments.forEach(assign => {
      const book = assign.bookId;
      if (!book || !book.chapters) return;

      if (!bookMap[book._id]) {
        bookMap[book._id] = { _id: book._id, name: book.name, coverUrl: book.coverUrl, chapters: [] };
      }

      const chapter = book.chapters.find(ch => ch._id.toString() === assign.chapterId.toString());
      if (chapter) {
        bookMap[book._id].chapters.push({ ...chapter, expiresAt: assign.expiresAt });
      }
    });

    // Process approved requests (only chapters with status 'approved')
    approvedRequests.forEach(reqItem => {
      const book = reqItem.bookId;
      if (!book || !book.chapters) return;

      if (!bookMap[book._id]) {
        bookMap[book._id] = { _id: book._id, name: book.name, coverUrl: book.coverUrl, chapters: [] };
      }

      reqItem.chapters.forEach(chObj => {
        if (chObj.status !== 'approved') return;

        // Avoid duplicates if already added via expiry
        if (!bookMap[book._id].chapters.find(c => c._id.toString() === chObj.chapterId.toString())) {
          const chapter = book.chapters.find(ch => ch._id.toString() === chObj.chapterId.toString());
          if (chapter) bookMap[book._id].chapters.push(chapter);
        }
      });
    });

    res.json({ success: true, books: Object.values(bookMap) });
  } catch (err) {
    console.error('❌ Error in /user/chapter-access/all:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// router.get('/user/chapter-access/all', verifyToken, async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const approvedRequests = await ChapterAccessRequest.find({ userId })
//       .populate('bookId', 'name chapters')
//       .lean();

//     const accessData = [];

//     approvedRequests.forEach(reqItem => {
//       // ✅ Only include approved chapters
//       const approvedChapters = reqItem.chapters.filter(ch => ch.status === 'approved');

//       // ❌ Skip books that have no approved chapters
//       if (approvedChapters.length === 0) return;

//       // ✅ Map chapter info
//       const chapters = approvedChapters.map(ch => {
//         const chapterMeta = reqItem.bookId.chapters.find(
//           c => c._id.toString() === ch.chapterId.toString()
//         );
//         return {
//           chapterId: ch.chapterId,
//           chapterName: chapterMeta?.name || 'Unknown Chapter'
//         };
//       });

//       accessData.push({
//         bookId: reqItem.bookId._id,
//         bookName: reqItem.bookId.name,
//         chapters
//       });
//     });

//     res.json(accessData);
//   } catch (err) {
//     console.error('❌ Error fetching user chapter access:', err);
//     res.status(500).json({ message: 'Server error fetching chapter access' });
//   }
// });



// router.get('/user/chapter-access/:bookId', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'No token' });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const requests = await ChapterAccessRequest.find({
//       userId: decoded.id,
//       bookId: req.params.bookId,
//       status: 'approved'
//     }).lean();

//     const accessInfo = requests.flatMap(r => 
//   r.chapters.map(chapterId => ({
//     chapterId: chapterId.toString()
//   }))
// );

//     res.json({ success: true, accessInfo });
//   } catch (err) {
//     console.error('Error fetching chapter access:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



// router.get('/user/chapter-access/:bookId', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) return res.status(401).json({ message: 'No token provided' });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Fetch all access entries for this user and book
//     const accessList = await ChapterAssignment.find({
//       userId: decoded.id,
//       bookId: req.params.bookId
//     });

//     const accessInfo = accessList.map(a => ({
//       chapterId: a.chapterId.toString(),
//       expiresAt: a.expiresAt,
//     }));

//     res.json({ success: true, accessInfo });
//   } catch (err) {
//     console.error('Error fetching chapter access:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });



router.get('/user/chapter-access/:bookId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { bookId } = req.params;

    // 1️⃣ Fetch expiry-based access
    const expiryAssignments = await ChapterAssignment.find({ userId, bookId }).lean();

    // 2️⃣ Fetch approved access requests
    const approvedRequests = await ChapterAccessRequest.find({
      userId,
      bookId,
      'chapters.status': 'approved',
    }).lean();

    const accessMap = new Map();

    // Add expiry-based first (priority)
    expiryAssignments.forEach(a => {
      accessMap.set(a.chapterId.toString(), { chapterId: a.chapterId.toString(), expiresAt: a.expiresAt });
    });

    // Add approved ones if not already present
    approvedRequests.forEach(req => {
      req.chapters.forEach(chObj => {
        if (chObj.status === 'approved' && !accessMap.has(chObj.chapterId.toString())) {
          accessMap.set(chObj.chapterId.toString(), { chapterId: chObj.chapterId.toString() });
        }
      });
    });

    res.json({ success: true, accessInfo: Array.from(accessMap.values()) });
  } catch (err) {
    console.error('❌ Error fetching chapter access:', err);
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



// router.get('/admin/access-management', async (req, res) => {
//   try {
//     const [approvedRequests, expiryAssignments] = await Promise.all([
//       ChapterAccessRequest.find({ status: 'approved' })
//         .populate('userId', 'name email')
//         .populate('bookId', 'name chapters'),
//       ChapterAssignment.find()
//         .populate('userId', 'name email')
//         .populate('bookId', 'name chapters')
//     ]);

//     const accessMap = new Map();

//     // Process expiry-based assignments first (priority)
//     expiryAssignments.forEach(assign => {
//       if (!assign.userId || !assign.bookId || !assign.chapterId) return;

//       const key = `${assign.userId._id}_${assign.bookId._id}_${assign.chapterId}`;
//       const chapter = assign.bookId.chapters.find(
//         ch => ch._id.toString() === assign.chapterId.toString()
//       );

//       accessMap.set(key, {
//         type: 'expiry',
//         chapterId: assign.chapterId,
//         expiresAt: assign.expiresAt,
//         bookId: assign.bookId._id,
//         bookName: assign.bookId.name,
//         chapterName: chapter?.name || 'Unknown',
//         user: assign.userId,
//         accessId: assign._id
//       });
//     });

//     // Process approved requests if not already overridden by expiry
//     approvedRequests.forEach(req => {
//       if (!req.userId || !req.bookId || !req.chapters) return;

//       req.chapters.forEach(chId => {
//         const key = `${req.userId._id}_${req.bookId._id}_${chId}`;
//         if (!accessMap.has(key)) {
//           const chapter = req.bookId.chapters.find(
//             ch => ch._id.toString() === chId.toString()
//           );

//           accessMap.set(key, {
//             type: 'approved',
//             chapterId: chId,
//             bookId: req.bookId._id,
//             bookName: req.bookId.name,
//             chapterName: chapter?.name || 'Unknown',
//             user: req.userId,
//             accessId: req._id
//           });
//         }
//       });
//     });

//     // Group by user
//     const grouped = {};
//     accessMap.forEach(access => {
//       const uid = access.user._id;
//       if (!grouped[uid]) {
//         grouped[uid] = {
//           user: access.user,
//           chapters: []
//         };
//       }
//       grouped[uid].chapters.push(access);
//     });

//     res.json(Object.values(grouped));
//   } catch (err) {
//     console.error("❌ Failed to load access-management:", err);
//     res.status(500).json({ message: 'Server error while loading access data' });
//   }
// });






// router.get('/admin/access-management', async (req, res) => {
//   try {
//     const [approvedRequests, expiryAssignments] = await Promise.all([
//       ChapterAccessRequest.find({}).populate('userId', 'name email').populate('bookId', 'name chapters').lean(),
//       ChapterAssignment.find({}).populate('userId', 'name email').populate('bookId', 'name chapters').lean()
//     ]);

//     const accessMap = new Map();

//     // Process expiry assignments first
//     expiryAssignments.forEach(assign => {
//       if (!assign.userId || !assign.bookId || !assign.chapterId) return;

//       const key = `${assign.userId._id}_${assign.bookId._id}_${assign.chapterId}`;
//       const chapter = assign.bookId.chapters.find(ch => ch._id.toString() === assign.chapterId.toString());

//       accessMap.set(key, {
//         type: 'expiry',
//         chapterId: assign.chapterId,
//         expiresAt: assign.expiresAt,
//         bookId: assign.bookId._id,
//         bookName: assign.bookId.name,
//         chapterName: chapter?.name || 'Unknown',
//         user: assign.userId,
//         accessId: assign._id
//       });
//     });

//     // Process approved requests
//     approvedRequests.forEach(reqItem => {
//       if (!reqItem.userId || !reqItem.bookId || !reqItem.chapters) return;

//       reqItem.chapters.forEach(chObj => {
//         if (chObj.status !== 'approved') return;

//         const key = `${reqItem.userId._id}_${reqItem.bookId._id}_${chObj.chapterId}`;
//         if (!accessMap.has(key)) {
//           const chapter = reqItem.bookId.chapters.find(ch => ch._id.toString() === chObj.chapterId.toString());
//           accessMap.set(key, {
//             type: 'approved',
//             chapterId: chObj.chapterId,
//             bookId: reqItem.bookId._id,
//             bookName: reqItem.bookId.name,
//             chapterName: chapter?.name || 'Unknown',
//             user: reqItem.userId,
//             accessId: reqItem._id
//           });
//         }
//       });
//     });

//     // Group by user
//     const grouped = {};
//     accessMap.forEach(access => {
//       const uid = access.user._id;
//       if (!grouped[uid]) grouped[uid] = { user: access.user, chapters: [] };
//       grouped[uid].chapters.push(access);
//     });

//     res.json(Object.values(grouped));
//   } catch (err) {
//     console.error("❌ Failed to load access-management:", err);
//     res.status(500).json({ message: 'Server error while loading access data' });
//   }
// });


router.get('/admin/access-management', async (req, res) => {
  try {
    const [allRequests, expiryAssignments] = await Promise.all([
      ChapterAccessRequest.find() // ✅ fetch all (not just approved)
        .populate('userId', 'name email')
        .populate('bookId', 'name chapters')
        .lean(),
      ChapterAssignment.find({})
        .populate('userId', 'name email')
        .populate('bookId', 'name chapters')
        .lean()
    ]);

    const accessMap = new Map();

    // --- Step 1: Expiry-based Access
    expiryAssignments.forEach(assign => {
      if (!assign.userId || !assign.bookId || !assign.chapterId) return;

      const key = `${assign.userId._id}_${assign.bookId._id}_${assign.chapterId}`;
      const chapter = assign.bookId.chapters.find(ch => ch._id.toString() === assign.chapterId.toString());

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

    // --- Step 2: Approved (Permanent) Access
    allRequests.forEach(reqItem => {
      if (!reqItem.userId || !reqItem.bookId) return;

      // ✅ Filter chapter-level approvals
      reqItem.chapters
        .filter(ch => ch.status === 'approved')
        .forEach(ch => {
          const key = `${reqItem.userId._id}_${reqItem.bookId._id}_${ch.chapterId}`;
          if (accessMap.has(key)) return; // Skip if expiry entry exists

          const chapter = reqItem.bookId.chapters.find(c => c._id.toString() === ch.chapterId.toString());
          if (!chapter) return;

          accessMap.set(key, {
            type: 'approved',
            chapterId: ch.chapterId,
            bookId: reqItem.bookId._id,
            bookName: reqItem.bookId.name,
            chapterName: chapter.name,
            user: reqItem.userId,
            accessId: reqItem._id
          });
        });
    });

    // --- Step 3: Group by user
    const result = [];
    accessMap.forEach(value => {
      let userEntry = result.find(r => r.user._id.toString() === value.user._id.toString());
      if (!userEntry) {
        userEntry = { user: value.user, chapters: [] };
        result.push(userEntry);
      }
      userEntry.chapters.push(value);
    });

    res.json(result);
  } catch (err) {
    console.error('❌ Access management fetch error:', err);
    res.status(500).json({ message: 'Server error while fetching access management data' });
  }
});



/////////////////////////////////c1upar 


// router.delete('/admin/revoke-access/:accessId/:chapterId', async (req, res) => {
//   try {
//     const { accessId, chapterId } = req.params;
//     const accessRequest = await ChapterAccessRequest.findById(accessId);
//     if (!accessRequest) {
//       const deleted = await ChapterAssignment.findOneAndDelete({ _id: accessId, chapterId: chapterId });
//        if (!deleted) return res.status(404).json({ message: 'No access found' });
//     } else {
//         accessRequest.chapters = accessRequest.chapters.filter(
//           chId => chId.toString() !== chapterId
//         );
//         if (accessRequest.chapters.length === 0) {
//             await ChapterAccessRequest.findByIdAndDelete(accessId);
//         } else {
//             await accessRequest.save();
//         }
//     }

//     res.json({ message: '✅ Access revoked' });
//   } catch (err) {
//     console.error("❌ Revoke access error:", err);
//     res.status(500).json({ message: 'Server error while revoking access' });
//   }
// });


// ✅ FIXED VERSION
router.delete('/admin/revoke-access/:accessId/:chapterId', async (req, res) => {
  try {
    const { accessId, chapterId } = req.params;
    const accessRequest = await ChapterAccessRequest.findById(accessId);

    if (!accessRequest) {
      // Try fallback: maybe it’s a ChapterAssignment ID
      const deleted = await ChapterAssignment.findOneAndDelete({ _id: accessId, chapterId });
      if (!deleted) return res.status(404).json({ message: 'No access found' });
    } else {
      // ✅ FIX: use correct field for filtering
      accessRequest.chapters = accessRequest.chapters.filter(
        ch => ch.chapterId.toString() !== chapterId.toString()
      );

      // If no chapters left → remove entire request
      if (accessRequest.chapters.length === 0) {
        await ChapterAccessRequest.findByIdAndDelete(accessId);
      } else {
        await accessRequest.save();
      }
    }

    res.json({ message: '✅ Access revoked successfully' });
  } catch (err) {
    console.error("❌ Revoke access error:", err);
    res.status(500).json({ message: 'Server error while revoking access' });
  }
});


// router.post('/admin/assign-chapters', async (req, res) => {
//   try {
//     const { userId, bookId, chapters, durationDays } = req.body;

//     if (!userId || !bookId || !Array.isArray(chapters) || chapters.length === 0 || !durationDays) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const now = new Date();
//     const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

//     await ChapterAccessRequest.updateMany(
//       { userId, bookId, status: 'approved', chapters: { $in: chapters } },
//       { $pull: { chapters: { $in: chapters } } }
//     );

//     await ChapterAccessRequest.deleteMany({ userId, bookId, status: 'approved', chapters: { $size: 0 } });

//     const assignments = chapters.map(chapterId => ({
//       userId,
//       bookId,
//       chapterId,
//       assignedAt: now,
//       expiresAt
//     }));

//     await ChapterAssignment.insertMany(assignments);

//     const book = await Book.findById(bookId);
//     const user = await User.findById(userId);

//     for (const chapterId of chapters) {
//       const chapter = book.chapters.find(ch => ch._id.toString() === chapterId.toString());
//       if (chapter) {
//         const messageToUser = `📚 Chapter "${chapter.name}" from "${book.name}" assigned until ${expiresAt.toLocaleDateString()}`;
//         await createNotification({ userId, type: 'assigned', message: messageToUser }, req);

//         const messageToAdmin = `🛡️ Assigned chapter "${chapter.name}" from "${book.name}" to user "${user.name}" (${user.email}) until ${expiresAt.toLocaleDateString()}`;
//         await createNotification({ message: messageToAdmin, type: 'assigned', forAdmin: true });
//       }
//     }

//     res.status(201).json({ message: '✅ Chapters assigned successfully with expiry' });
//   } catch (err) {
//     console.error('Assignment error:', err);
//     res.status(500).json({ message: 'Server error while assigning chapters' });
//   }
// });



router.post('/admin/assign-chapters', async (req, res) => {
  try {
    const { userId, bookId, chapters, durationDays } = req.body;

    if (!userId || !bookId || !Array.isArray(chapters) || chapters.length === 0 || !durationDays) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // 1️⃣ Remove approved chapters from ChapterAccessRequest
    await ChapterAccessRequest.updateMany(
      { userId, bookId, status: 'approved' },
      { $pull: { chapters: { chapterId: { $in: chapters } } } }
    );

    // 2️⃣ Delete empty requests
    await ChapterAccessRequest.deleteMany({ userId, bookId, status: 'approved', chapters: { $size: 0 } });

    // 3️⃣ Insert expiry-based assignments
    const assignments = chapters.map(chapterId => ({
      userId,
      bookId,
      chapterId,
      assignedAt: now,
      expiresAt
    }));
    await ChapterAssignment.insertMany(assignments);

    // 4️⃣ Send notifications
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


router.get('/user/assigned-books', verifyToken(), async (req, res) => {
    try {
        const userId = req.user.id;
        const assignments = await ChapterAssignment.find({ userId }).populate({
            path: 'bookId',
            select: 'name coverUrl chapters',
        }).lean();

        const bookMap = {};
        for (let assign of assignments) {
            const book = assign.bookId;
            if (!book || !book.chapters) continue;
            if (!bookMap[book._id]) {
                bookMap[book._id] = { _id: book._id, name: book.name, coverUrl: book.coverUrl, chapters: [] };
            }
            const chapter = book.chapters.find(ch => ch._id.toString() === assign.chapterId.toString());
            if (chapter) {
                bookMap[book._id].chapters.push({ ...chapter, expiresAt: assign.expiresAt });
            }
        }
        res.json({ success: true, books: Object.values(bookMap) });
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
    try {
        let token;

        // Check for token in header (for button clicks)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } 
        // If not in header, check body (for tab close / sendBeacon)
        else if (req.body && req.body.token) {
            token = req.body.token;
        }

        if (!token) {
            return res.status(400).json({ message: 'No token provided for logout.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id, role } = decoded;
        let model;

        if (role === 'user') model = User;
        else if (role === 'admin') model = Admin;
        else if (role === 'vendor') model = Vendor;
        else return res.status(400).json({ message: 'Invalid role' });

        // Find the user and check if the token matches before logging out
        const user = await model.findById(id);
        if (user && user.currentToken === token) {
            await model.findByIdAndUpdate(id, { currentToken: null, isOnline: false });
        }
        
        res.status(200).json({ message: 'Logged out successfully' });

    } catch (err) {
        // Suppress benign errors like "jwt expired" on logout
        if (err.name !== 'TokenExpiredError' && err.name !== 'JsonWebTokenError') {
             console.error('Logout error:', err);
        }
        // Always send a success response to the frontend on logout
        res.status(200).json({ message: 'Logout processed' });
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

router.put('/user/change-password', verifyToken(), async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Both old and new passwords are required.' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password.' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: '✅ Password updated successfully!' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ message: 'Server error while changing password.' });
    }
});

router.get('/user/pending-requests', verifyToken(), async (req, res) => {
    try {
        const userId = req.user.id;
        const pending = await ChapterAccessRequest.find({ userId, status: 'pending' })
            .populate('bookId', 'name').lean();
        const transformed = pending.map(req => ({
            bookName: req.bookId ? req.bookId.name : 'Unknown Book',
            chapters: req.chapters,
            status: req.status,
            requestedAt: req.requestedAt
        }));
        res.json({ success: true, pending: transformed });
    } catch (err) {
        console.error('Error fetching user pending requests:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/user/last-activity', verifyToken(), async (req, res) => {
    try {
        const userId = req.user.id;
        const lastLog = await ActivityLog.findOne({ userId })
            .sort({ lastActive: -1 })
            .populate({ path: 'bookId', select: 'name chapters' })
            .lean();

        if (!lastLog || !lastLog.bookId) {
            return res.json({ success: true, data: null });
        }
        const chapter = lastLog.bookId.chapters.find(ch => ch._id.toString() === lastLog.chapterId.toString());
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

router.put('/user/update-details', verifyToken(), async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
        }
        const updatedUser = await User.findByIdAndUpdate(userId, { name: name.trim() }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({
            message: '✅ Profile updated successfully!',
            user: { name: updatedUser.name }
        });
    } catch (err) {
        console.error('User update error:', err);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
});

router.get('/admin/user-management-data', verifyToken(['admin']), async (req, res) => {
    try {
        const usersWithStats = await User.aggregate([
            // Stage 1: Join with ChapterAccessRequests to find approved content
            {
                $lookup: {
                    from: 'chapteraccessrequests',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'accessRequests'
                }
            },
            // Stage 2: Join with ChapterAssignments to find timed content
            {
                $lookup: {
                    from: 'chapterassignments',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'assignments'
                }
            },
            // Stage 3: Join with ActivityLog to find the last active time
            {
                $lookup: {
                    from: 'activitylogs',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'activity'
                }
            },
            // Stage 4: Reshape the data and calculate counts
            {
                $project: {
                    name: 1,
                    email: 1,
                    isOnline: { $ifNull: ["$isOnline", false] }, // Defaults isOnline to false if not present
                    lastActive: { $max: "$activity.lastActive" }, // Get the most recent activity date

                    // Filter for only 'approved' requests
                    approvedItems: {
                        $filter: {
                            input: '$accessRequests',
                            as: 'req',
                            cond: { $eq: ['$$req.status', 'approved'] }
                        }
                    },
                    assignedItems: '$assignments'
                }
            },
            // Stage 5: Finalize the counts
            {
                $project: {
                    name: 1,
                    email: 1,
                    isOnline: 1,
                    lastActive: 1,
                    approvedChaptersCount: { $sum: { $map: { input: "$approvedItems", as: "item", in: { $size: "$$item.chapters" } } } },
                    approvedBooksCount: { $size: { $setUnion: "$approvedItems.bookId" } }, // Count unique books
                    assignedChaptersCount: { $size: "$assignedItems" },
                    assignedBooksCount: { $size: { $setUnion: "$assignedItems.bookId" } } // Count unique books
                }
            }
        ]);

        res.json({ success: true, users: usersWithStats });

    } catch (err) {
        console.error('Failed to generate user management data:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// // Approve chapter access request
// router.put('/admin/approve-request/:id', async (req, res) => {
//   try {
//     const request = await ChapterAccessRequest.findById(req.params.id)
//       .populate('userId', 'name email')
//       .populate('bookId', 'name chapters');

//     if (!request) return res.status(404).json({ message: 'Request not found' });

//     // Mark request as approved
//     request.status = 'approved';
//     request.chapters.forEach(ch => (ch.status = 'approved'));
//     await request.save();

//     // Create user notification
//     await Notification.create({
//       userId: request.userId._id,
//       title: 'Chapter Access Approved',
//       message: `Your request for "${request.bookId.name}" has been approved.`,
//       link: `/books/${request.bookId._id}`,
//     });

//     res.json({ message: 'Access approved successfully', request });
//   } catch (err) {
//     console.error('Error approving request:', err);
//     res.status(500).json({ message: 'Error approving request' });
//   }
// });


// // Reject chapter access request
// router.put('/admin/reject-request/:id', async (req, res) => {
//   try {
//     const request = await ChapterAccessRequest.findById(req.params.id)
//       .populate('userId', 'name email')
//       .populate('bookId', 'name');

//     if (!request) return res.status(404).json({ message: 'Request not found' });

//     request.status = 'rejected';
//     request.chapters.forEach(ch => (ch.status = 'rejected'));
//     await request.save();

//     await Notification.create({
//       userId: request.userId._id,
//       title: 'Chapter Access Rejected',
//       message: `Your request for "${request.bookId.name}" was rejected.`,
//     });

//     res.json({ message: 'Access request rejected successfully', request });
//   } catch (err) {
//     console.error('Error rejecting request:', err);
//     res.status(500).json({ message: 'Error rejecting request' });
//   }
// });
// ✅ Get all requests by user for a specific book
router.get('/user/access-requests/:bookId', verifyToken, async (req, res) => {
  try {
    const requests = await ChapterAccessRequest.find({
      userId: req.user.id,
      bookId: req.params.bookId,
    });

    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});



module.exports = router;
