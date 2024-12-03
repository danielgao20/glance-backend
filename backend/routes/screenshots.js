const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Screenshot = require('../models/Screenshot');
const axios = require('axios');
const Tesseract = require('tesseract.js'); // OCR library

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
    cb(null, `screenshot-${Date.now()}.jpg`);
  },
});
const upload = multer({ storage });

// serve static files from the uploads directory
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// main POST route to handle screenshots
router.post('/', upload.single('screenshot'), async (req, res) => {
  const { username, filename } = req.body;

  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!username || !filename) {
    console.error('Missing username or filename');
    return res.status(400).json({ error: 'Missing username or filename' });
  }

  try {
    const uploadPath = path.join(__dirname, '../uploads', filename);
    fs.renameSync(req.file.path, uploadPath);
    console.log('File saved at:', uploadPath);

    // extract text from the screenshot using Tesseract.js
    console.log('Starting OCR process...');
    const ocrResult = await Tesseract.recognize(uploadPath, 'eng');
    const extractedText = ocrResult.data.text;

    console.log('Extracted Text:', extractedText);

    // generate description using OpenAI API
    const prompt = `
      Below is text extracted from a screenshot. Analyze it and generate a concise one-sentence task description based on the content:

      Extracted Text:
      ${extractedText}
    `;

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'Generate concise descriptions.' },
          { role: 'user', content: prompt },
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

    const description = openaiResponse.data.choices[0].message.content.trim();

    // save screenshot details to MongoDB
    const newScreenshot = new Screenshot({
      username,
      screenshot_url: `/uploads/${filename}`,
      description,
      created_at: new Date(),
    });

    await newScreenshot.save();

    console.log('Screenshot saved to database:', newScreenshot);

    res.status(201).json(newScreenshot);
  } catch (error) {
    console.error('Error handling screenshot:', error.message);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
