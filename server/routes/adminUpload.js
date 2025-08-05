const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Book = require('../models/Book');
const { PDFDocument } = require('pdf-lib');
const mongoose = require('mongoose');
require('dotenv').config();

// --- NEW IMPORTS for file system and running commands ---
const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec); // Convert exec to a promise-based function

const router = express.Router();

// --- S3 and Multer setup (No changes) ---
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const upload = multer({ storage: multer.memoryStorage() });
const cpUpload = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]);
const uploadFileToS3 = async (buffer, filename, mimetype) => {
  const params = { Bucket: process.env.AWS_BUCKET_NAME, Key: filename, Body: buffer, ContentType: mimetype };
  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
};


// --- 📚 FINAL, HIGH-PERFORMANCE Save Book Route ---
router.post('/save-book', cpUpload, async (req, res) => {
  const tempDir = path.join(__dirname, '..', 'temp'); // Create a temporary directory

  try {
    const { name, contents, subject, tags, chaptersMeta: chaptersJson } = req.body;
    const chaptersMeta = JSON.parse(chaptersJson);

    if (!req.files?.cover?.[0] || !req.files?.pdf?.[0]) {
      return res.status(400).json({ message: 'Missing cover or PDF file' });
    }

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // --- Part 1: Upload Cover and Master PDF (No changes) ---
    const coverFile = req.files.cover[0];
    const pdfFile = req.files.pdf[0];
    const timestamp = Date.now();
    const coverUrl = await uploadFileToS3(coverFile.buffer, `books/${timestamp}-cover.jpg`, coverFile.mimetype);
    const mainPdfUrl = await uploadFileToS3(pdfFile.buffer, `books/${timestamp}-master.pdf`, pdfFile.mimetype);

    // --- Part 2: Split and Linearize each chapter ---
    // ✅ --- THE FIX: Added { ignoreEncryption: true } to handle protected PDFs ---
    const mainPdfDoc = await PDFDocument.load(pdfFile.buffer, { ignoreEncryption: true });
    const totalPages = mainPdfDoc.getPageCount();
    






    // Loop through each chapter metadata
    // for (const [idx, meta] of chaptersMeta.entries()) {
    //   const fromPage = Number(meta.fromPage);
    //   const toPage = Number(meta.toPage);

    //   if (fromPage <= 0 || toPage > totalPages || fromPage > toPage) {
    //     return res.status(400).json({ message: `Invalid page range for chapter "${meta.name}"` });
    //   }

    //   // 1. Split the chapter using pdf-lib
    //   const chapterPdfDoc = await PDFDocument.create();
    //   const pageIndices = Array.from({ length: toPage - fromPage + 1 }, (_, i) => fromPage - 1 + i);
    //   const copiedPages = await chapterPdfDoc.copyPages(mainPdfDoc, pageIndices);
    //   copiedPages.forEach(page => chapterPdfDoc.addPage(page));
    //   const chapterPdfBytes = await chapterPdfDoc.save();

    //   // 2. Save the split chapter to a temporary file
    //   const tempInputPath = path.join(tempDir, `input-${timestamp}-${idx}.pdf`);
    //   const tempOutputPath = path.join(tempDir, `output-${timestamp}-${idx}.pdf`);
    //   await fs.writeFile(tempInputPath, chapterPdfBytes);

    //   // 3. ✅ Use qpdf to linearize the temporary file
    //   try {
    //     const qpdfCommand = '"D:\\qpdfff\\qpdf-12.2.0-mingw64\\bin\\qpdf.exe"';
    //     await execPromise(`${qpdfCommand} --linearize "${tempInputPath}" "${tempOutputPath}"`);
    //   } catch (qpdfError) {
    //     console.error("QPDF Error:", qpdfError);
    //     throw new Error("Failed to linearize PDF. Make sure 'qpdf' is installed on the server.");
    //   }
      
    //   // 4. Read the optimized, linearized PDF back into a buffer
    //   const linearizedPdfBuffer = await fs.readFile(tempOutputPath);
      
    //   // 5. Upload the final, optimized buffer to S3
    //   const chapterKey = `books/chapters/${name.replace(/\s+/g, '-')}/${meta.name.replace(/\s+/g, '-')}-${timestamp}.pdf`;
    //   const chapterPdfUrl = await uploadFileToS3(linearizedPdfBuffer, chapterKey, 'application/pdf');

    //   chapters.push({
    //     _id: new mongoose.Types.ObjectId(),
    //     name: meta.name,
    //     description: meta.description,
    //     fromPage,
    //     toPage,
    //     price: Number(meta.price),
    //     order: idx,
    //     pdfUrl: chapterPdfUrl, // This is now the URL to the super-fast, linearized PDF
    //     subchapters: meta.subchapters || []
    //   });
    // }


const chapterPromises = chaptersMeta.map(async (meta, idx) => {
  try {
    const fromPage = Number(meta.fromPage);
    const toPage = Number(meta.toPage);

    if (fromPage <= 0 || toPage > totalPages || fromPage > toPage) {
      throw new Error(`Invalid page range for chapter "${meta.name}"`);
    }

    const chapterPdfDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: toPage - fromPage + 1 }, (_, i) => fromPage - 1 + i);
    const copiedPages = await chapterPdfDoc.copyPages(mainPdfDoc, pageIndices);
    copiedPages.forEach(page => chapterPdfDoc.addPage(page));
    const chapterPdfBytes = await chapterPdfDoc.save();

    const tempInputPath = path.join(tempDir, `input-${timestamp}-${idx}.pdf`);
   

    const tempOutputPath = path.join(tempDir, `output-${timestamp}-${idx}.pdf`);
    await fs.writeFile(tempInputPath, chapterPdfBytes);

    // const qpdfCommand = '"D:\\qpdfff\\qpdf-12.2.0-mingw64\\bin\\qpdf.exe"';
    const qpdfCommand = 'qpdf'; 
    console.log(`⚙️ Running QPDF to linearize "${meta.name}"...`);

    // await execPromise(`${qpdfCommand} --linearize "${tempInputPath}" "${tempOutputPath}"`);
    const { stdout, stderr } = await execPromise(`${qpdfCommand} --linearize "${tempInputPath}" "${tempOutputPath}"`);
    console.log('QPDF STDOUT:', stdout);
    console.error('QPDF STDERR:', stderr);

    console.log(`✅ QPDF linearized: ${tempOutputPath}`);
    const linearizedPdfBuffer = await fs.readFile(tempOutputPath);

    const chapterKey = `books/chapters/${name.replace(/\s+/g, '-')}/${meta.name.replace(/\s+/g, '-')}-${timestamp}.pdf`;
    const { stdout: checkOut } = await execPromise(`${qpdfCommand} --check "${tempOutputPath}"`);
    console.log(`✅ Linearization check before upload: ${checkOut}`);

    const chapterPdfUrl = await uploadFileToS3(linearizedPdfBuffer, chapterKey, 'application/pdf');

    return {
      _id: new mongoose.Types.ObjectId(),
      name: meta.name,
      description: meta.description,
      fromPage,
      toPage,
      price: Number(meta.price),
      order: idx,
      pdfUrl: chapterPdfUrl,
      subchapters: meta.subchapters || []
    };
  } catch (err) {
    console.error(`Error processing chapter "${meta.name}":`, err);
    throw err;
  }
});
const chapters = await Promise.all(chapterPromises); // ✅ works!




    



    // --- Part 3: Save the book data to MongoDB ---
    const book = new Book({ name, contents, subject, tags, coverUrl, pdfUrl: mainPdfUrl, chapters });
    await book.save();

    res.status(201).json({ message: '✅ Book uploaded and optimized successfully', book });

  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  } finally {
    // --- Part 4: Clean up the temporary directory ---
    try {
        await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
        console.error("Failed to cleanup temp directory:", cleanupError);
    }
  }
});

module.exports = router;






