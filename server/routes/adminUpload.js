const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Book = require('../models/Book');
const crypto = require('crypto');
require('dotenv').config();

const router = express.Router();

// S3 config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer for cover + chapters (optional, or could do base64 / buffer upload if frontend sends FormData)
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'chapters', maxCount: 50 },
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

router.post('/save-book', cpUpload, async (req, res) => {
  try {
    // Parse text fields
   const { name, contents, subject, tags, chaptersMeta: chaptersJson } = req.body;
const chaptersMeta = JSON.parse(chaptersJson);


    // Upload cover
    const cover = req.files['cover'][0];
    const coverKey = `books/${Date.now()}-${cover.originalname}`;
    const coverUrl = await uploadFileToS3(cover.buffer, coverKey, cover.mimetype);

    // Upload chapters
    const chapterFiles = req.files['chapters'];
    const uploadedChapters = await Promise.all(
      chapterFiles.map(async (file, idx) => {
        const chapterKey = `books/${Date.now()}-${file.originalname}`;
        const pdfUrl = await uploadFileToS3(file.buffer, chapterKey, file.mimetype);
        return {
          ...chaptersMeta[idx],
          pdfUrl,
        };
      })
    );

    const totalPrice = uploadedChapters.reduce((sum, ch) => sum + Number(ch.price || 0), 0);

    const book = new Book({
      name,
      contents,
      subject,
      tags,
      coverUrl,
      chapters: uploadedChapters,
      price: totalPrice,
    });

    await book.save();
    res.status(201).json({ message: 'Book uploaded successfully', book });
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

module.exports = router;
