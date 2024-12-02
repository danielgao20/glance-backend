const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Screenshot = require('../models/Screenshot');
const axios = require('axios');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Add static route for serving files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

router.post('/screenshots', upload.single('screenshot'), async (req, res) => {
  const { user_id } = req.body;

  try {
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

    // Save data to MongoDB
    const newScreenshot = new Screenshot({
      user_id,
      screenshot_url: imagePath,
      description,
      created_at: new Date(),
    });

    await newScreenshot.save();

    req.io.emit('new_screenshot', newScreenshot);
    res.status(201).json(newScreenshot);
  } catch (error) {
    console.error('Error handling screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
