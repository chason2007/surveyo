const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const required = ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
required.forEach(k => {
  if (!process.env[k]) throw new Error(`Missing required env var: ${k}`);
});

const app = express();

// Comma-separated list supported (e.g. prod + preview URLs). Trailing
// slashes are stripped on both sides since browsers never send one in
// the Origin header but it's easy to paste one into an env var.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// Routes
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/surveys', require('./routes/report'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));