// server.js - Main server file
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure upload directories exist
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create book-covers directory if it doesn't exist
const bookCoversDir = path.join(uploadsDir, 'book-covers');
if (!fs.existsSync(bookCoversDir)) {
  fs.mkdirSync(bookCoversDir, { recursive: true });
}

// Database connection
const db = require('./config/database');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/books', require('./routes/books'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Peminjaman buku API telah berjalan!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  console.log('Terhubung ke MySQL database');
  connection.release(); // Release the connection back to the pool

  app.listen(PORT, () => {
    console.log(`Server berjalan di PORT ${PORT}`);
  });
});