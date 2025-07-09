const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Book = require('../models/Book');
require('dotenv').config();

const router = express.Router();

// AWS S3 setup
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]);

// Upload helper
const uploadFileToS3 = async (buffer, filename, mimetype) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};

// 📚 Save Book Route (single PDF + chapter metadata)
router.post('/save-book', cpUpload, async (req, res) => {
  try {
    const { name, contents, subject, tags, chaptersMeta: chaptersJson } = req.body;
    const chaptersMeta = JSON.parse(chaptersJson);

    // Validate files
    if (!req.files?.cover?.[0] || !req.files?.pdf?.[0]) {
      return res.status(400).json({ message: 'Missing cover or PDF file' });
    }

    const coverFile = req.files.cover[0];
    const pdfFile = req.files.pdf[0];

    // Upload files to S3
    const timestamp = Date.now();
    const coverUrl = await uploadFileToS3(
      coverFile.buffer,
      `books/${timestamp}-${coverFile.originalname}`,
      coverFile.mimetype
    );

    const pdfUrl = await uploadFileToS3(
      pdfFile.buffer,
      `books/${timestamp}-${pdfFile.originalname}`,
      pdfFile.mimetype
    );

    // Prepare chapters (no PDF upload)
  const chapters = chaptersMeta.map((ch, idx) => ({
  name: ch.name,
  description: ch.description,
  fromPage: Number(ch.fromPage),
  toPage: Number(ch.toPage),
  price: Number(ch.price), // ✅ Add this line
  order: idx,
}));


    // Save in MongoDB
    const book = new Book({
      name,
      contents,
      subject,
      tags,
      coverUrl,
      pdfUrl,
      chapters
    });

    await book.save();

    res.status(201).json({ message: '✅ Book uploaded successfully', book });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
