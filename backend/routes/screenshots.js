const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GridFSBucket } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();
const upload = multer({ dest: 'temp/' }); // Temporary storage for incoming files

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('MongoDB URI is not defined in the .env file');
  process.exit(1);
}

// POST route for saving screenshots
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const conn = mongoose.connection;
    const gfs = new GridFSBucket(conn.db, { bucketName: 'screenshots' });

    const filename = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.resolve(req.file.path);
    const uploadStream = gfs.openUploadStream(filename, {
      metadata: { username: req.body.username },
    });

    // Pipe the file to GridFS
    fs.createReadStream(filePath)
      .pipe(uploadStream)
      .on('error', (err) => {
        console.error('Error during upload to GridFS:', err);
        res.status(500).json({ error: 'Failed to upload screenshot' });
      })
      .on('finish', () => {
        console.log('File uploaded successfully:', uploadStream.id);
        fs.unlinkSync(filePath); // Remove temporary file
        res.status(201).json({
          username: req.body.username,
          fileId: uploadStream.id,
          description: 'Hardcoded description for now.',
        });
      });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET route for fetching screenshots metadata
router.get('/', async (req, res) => {
  try {
    const conn = mongoose.connection;
    const gfs = new GridFSBucket(conn.db, { bucketName: 'screenshots' });

    const files = await gfs.find().toArray();
    res.status(200).json(files.map((file) => ({
      username: file.metadata?.username || 'Unknown',
      description: 'Hardcoded description for now.',
      fileId: file._id,
    })));
  } catch (error) {
    console.error('Error fetching screenshots:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET route for fetching image by file ID
router.get('/image/:id', (req, res) => {
  const conn = mongoose.connection;
  const gfs = new GridFSBucket(conn.db, { bucketName: 'screenshots' });

  const fileId = new mongoose.Types.ObjectId(req.params.id);

  gfs.openDownloadStream(fileId).pipe(res).on('error', (err) => {
    console.error('Error streaming image:', err.message);
    res.status(404).json({ error: 'Image not found' });
  });
});

module.exports = router;
