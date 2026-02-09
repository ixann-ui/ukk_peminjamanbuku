// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register user (only for testing, normally only admin can register students)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', class: studentClass, address, nisn, phone_number, max_borrow_limit = 5 } = req.body;

    // Validasi password harus mengandung setidaknya satu huruf besar
    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ message: 'Password harus mengandung setidaknya satu huruf besar' });
    }

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Pengguna sudah terdaftar' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const insertQuery = 'INSERT INTO users (name, email, password, role, class, address, nisn, phone_number, max_borrow_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      db.query(insertQuery, [name, email, hashedPassword, role, studentClass, address, nisn, phone_number, max_borrow_limit], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        // Get the created user
        const selectQuery = 'SELECT id, name, email, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture FROM users WHERE id = ?';
        db.query(selectQuery, [result.insertId], (err, userResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
          }

          const user = userResult[0];

          // Generate JWT token
          const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
          );

          res.status(201).json({
            message: 'Pengguna berhasil didaftarkan',
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              class: user.class,
              address: user.address,
              nisn: user.nisn,
              phone_number: user.phone_number,
              max_borrow_limit: user.max_borrow_limit,
              profile_picture: user.profile_picture
            }
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const query = 'SELECT id, name, email, password, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: 'Email salah atau tidak terdaftar' });
      }

      const user = results[0];

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Password salah' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          class: user.class,
          address: user.address,
          nisn: user.nisn,
          phone_number: user.phone_number,
          max_borrow_limit: user.max_borrow_limit,
          profile_picture: user.profile_picture
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  // In a real implementation, we would fetch the user from the database
  // For now, we'll return the user info from the token with profile picture
  const query = 'SELECT id, name, email, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture FROM users WHERE id = ?';
  db.query(query, [req.user.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const user = results[0];

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class,
        address: user.address,
        nisn: user.nisn,
        phone_number: user.phone_number,
        max_borrow_limit: user.max_borrow_limit,
        profile_picture: user.profile_picture
      }
    });
  });
});

module.exports = router;