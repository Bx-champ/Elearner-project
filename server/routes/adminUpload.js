const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Book = require('../models/Book');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

// S3 Client config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// Multer setup to store files locally temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage });

const cpUpload = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);

// Helper to upload buffer to S3
const uploadFileToS3 = async (buffer, filename, mimetype) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
    
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);

  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};

router.post('/upload', cpUpload, async (req, res) => {
  try {
    const { name, price, contents, subject, tags } = req.body;

    const cover = req.files['cover'][0];
    const pdf = req.files['pdf'][0];

    const coverFilename = `books/${Date.now()}-${cover.originalname}`;
    const pdfFilename = `books/${Date.now()}-${pdf.originalname}`;

    const coverUrl = await uploadFileToS3(cover.buffer, coverFilename, cover.mimetype);
    const pdfUrl = await uploadFileToS3(pdf.buffer, pdfFilename, pdf.mimetype);

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
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
