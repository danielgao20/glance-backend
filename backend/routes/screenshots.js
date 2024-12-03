const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Screenshot = require('../models/Screenshot');
const axios = require('axios');
const mongoose = require('mongoose');
const Tesseract = require('tesseract.js'); // for OCR lol

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
    // Validate and convert user_id to ObjectId
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: 'Invalid user_id format' });
    }
    const objectId = new mongoose.Types.ObjectId(user_id);

    const imagePath = path.join(__dirname, '../uploads', req.file.filename);

    // Extract text from the screenshot using Tesseract.js
    console.log('Starting OCR process...');
    const ocrResult = await Tesseract.recognize(imagePath, 'eng');
    const extractedText = ocrResult.data.text;

    console.log('Extracted Text:', extractedText);

    // Prepare the prompt using the extracted text
    const prompt = `
      Below is text extracted from a screenshot. Analyze it and generate a concise one-sentence task description based on the content:

      Extracted Text:
      ${extractedText}
    `;

    // Send the prompt to OpenAI API
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that analyzes text extracted from images and generates concise task descriptions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the generated description
    const description = openaiResponse.data.choices[0].message.content.trim();

    // Save the screenshot data to MongoDB
    const newScreenshot = new Screenshot({
      user_id: objectId,
      screenshot_url: `/uploads/${req.file.filename}`,
      description,
      created_at: new Date(),
    });

    await newScreenshot.save();

    console.log('Screenshot saved to database:', newScreenshot);

    // Send the response back to the client
    res.status(201).json(newScreenshot);
  } catch (error) {
    console.error('Error handling screenshot:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

module.exports = router;
