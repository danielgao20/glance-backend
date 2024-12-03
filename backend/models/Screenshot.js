const mongoose = require('mongoose');

const screenshotSchema = new mongoose.Schema({
    username: { type: String, required: true },
    screenshot_url: { type: String, required: true },
    description: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Screenshot', screenshotSchema);