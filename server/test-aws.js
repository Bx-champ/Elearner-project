const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1', // fallback if env is missing
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const testObjectAccess = async () => {
  try {
    const command = new HeadObjectCommand({
      Bucket: 'basantchamp100book',
      Key: 'books/test.pdf', // make sure this exists
    });
    const result = await s3Client.send(command);
    console.log("✅ Access OK:", result);
  } catch (err) {
    console.error("❌ Access error:", err);
  }
};

testObjectAccess();
