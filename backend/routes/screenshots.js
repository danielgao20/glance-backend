const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Screenshot = require('../models/Screenshot');
const axios = require('axios');
const mongoose = require('mongoose');

const router = express.Router();

// Multer setup: dynamically create the uploads folder if it doesn't exist
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Serve static files from the uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Main POST route to handle screenshots
router.post('/', upload.single('screenshot'), async (req, res) => {
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { user_id } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid user_id format' });
    }
    const objectId = new mongoose.Types.ObjectId(user_id);

    const imagePath = `/uploads/${req.file.filename}`;
    
    // Generate description using OpenAI API
    const prompt = 'Provide a concise one-sentence task title for the given screenshot.';
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [{ role: 'system', content: prompt }],
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const description = openaiResponse.data.choices[0].message.content.trim();

    // Save the screenshot data to MongoDB
    const newScreenshot = new Screenshot({
      user_id: objectId,
      screenshot_url: imagePath,
      description,
      created_at: new Date(),
    });

    await newScreenshot.save();

    console.log('Screenshot saved to database:', newScreenshot);

    // Send the response back to the client
    res.status(201).json(newScreenshot);
  } catch (error) {
    console.error('Error handling screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
