const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const Book = require('../models/Book'); // MongoDB Book Model
require('dotenv').config();

const router = express.Router();

// AWS Config
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// File upload settings
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const filename = `books/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
});

const cpUpload = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);

router.post('/upload', cpUpload, async (req, res) => {
  try {
    const { name, price, contents, subject, tags } = req.body;
    const coverUrl = req.files['cover'][0].location;
    const pdfUrl = req.files['pdf'][0].location;

    const book = new Book({
      name,
      price,
      contents,
      subject,
      tags,
      coverUrl,
      pdfUrl,
    });

    await book.save();
    res.status(201).json({ message: 'Book uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
