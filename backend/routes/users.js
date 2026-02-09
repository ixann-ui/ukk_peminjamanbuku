// routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { page = 1, limit = 10, search = '', role = '', sort_by = 'created_at', sort_order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  // Validate sort_by and sort_order parameters
  const validSortBy = ['id', 'name', 'email', 'role', 'created_at'];
  const validSortOrder = ['ASC', 'DESC'];

  const sortBy = validSortBy.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = validSortOrder.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

  let query = 'SELECT id, name, email, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture, created_at FROM users WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR nisn LIKE ? OR phone_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR nisn LIKE ? OR phone_number LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }

    db.query(countQuery, countParams, (err, countResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        users: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResults[0].total / limit),
          totalUsers: countResults[0].total,
          hasNextPage: page < Math.ceil(countResults[0].total / limit),
          hasPrevPage: page > 1
        }
      });
    });
  });
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Admin can view any user, regular user can only view their own profile
  if (req.user.role !== 'admin' && req.user.id != id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const query = 'SELECT id, name, email, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture, created_at, updated_at FROM users WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({ user: results[0] });
  });
});

// Create new user (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, role = 'student', class: studentClass, address, nisn, phone_number, max_borrow_limit = 5 } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Pengguna dengan email ini sudah ada' });
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
        const selectQuery = 'SELECT id, name, email, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture, created_at FROM users WHERE id = ?';
        db.query(selectQuery, [result.insertId], (err, userResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
          }

          res.status(201).json({
            message: 'Pengguna berhasil dibuat',
            user: userResult[0]
          });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to promisify database queries
const queryPromise = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Update user (admin can update any user, regular user can only update their own profile)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, class: studentClass, address, nisn, phone_number, max_borrow_limit } = req.body;

  try {
    // Check permissions
    if (req.user.role !== 'admin' && req.user.id != id) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Check if user exists
    const checkQuery = 'SELECT id FROM users WHERE id = ?';
    const userExists = await queryPromise(checkQuery, [id]);

    if (userExists.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update fields
    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }

    if (email) {
      // Check if email is already taken by another user
      const emailCheckQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
      const emailResults = await queryPromise(emailCheckQuery, [email, id]);

      if (emailResults.length > 0) {
        return res.status(400).json({ message: 'Email sudah digunakan' });
      }

      updateFields.push('email = ?');
      params.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      params.push(hashedPassword);
    }

    // Handle admin-specific updates
    if (req.user.role === 'admin') {
      if (role) {
        updateFields.push('role = ?');
        params.push(role);
      }
      if (studentClass !== undefined) {
        updateFields.push('class = ?');
        params.push(studentClass);
      }
      if (address !== undefined) {
        updateFields.push('address = ?');
        params.push(address);
      }
      if (nisn !== undefined) {
        // Check if nisn is already taken by another user
        const nisnCheckQuery = 'SELECT id FROM users WHERE nisn = ? AND id != ?';
        const nisnResults = await queryPromise(nisnCheckQuery, [nisn, id]);

        if (nisnResults.length > 0) {
          return res.status(400).json({ message: 'NISN sudah digunakan' });
        }

        updateFields.push('nisn = ?');
        params.push(nisn);
      }
      if (phone_number !== undefined) {
        updateFields.push('phone_number = ?');
        params.push(phone_number);
      }
      if (max_borrow_limit !== undefined) {
        updateFields.push('max_borrow_limit = ?');
        params.push(max_borrow_limit);
      }
    } else {
      // Allow students to update their own phone number
      if (phone_number !== undefined) {
        updateFields.push('phone_number = ?');
        params.push(phone_number);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Tidak ada bidang yang diperbarui' });
    }

    // Add the id to params for WHERE clause
    params.push(id);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await queryPromise(updateQuery, params);

    // Get updated user
    const selectQuery = 'SELECT id, name, email, role, class, address, nisn, phone_number, max_borrow_limit, profile_picture, created_at, updated_at FROM users WHERE id = ?';
    const userResult = await queryPromise(selectQuery, [id]);

    res.json({
      message: 'User updated successfully',
      user: userResult[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

// Upload profile image
const multer = require('multer');
const path = require('path');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-images/');
  },
  filename: (req, file, cb) => {
    // Create a unique filename using user id and timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
  }
});

router.post('/:id/upload-profile-image', authenticateToken, upload.single('profile_image'), async (req, res) => {
  const { id } = req.params;

  // Check permissions - user can only update their own profile image
  if (req.user.id != id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Check if user exists
  const checkQuery = 'SELECT id FROM users WHERE id = ?';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      // return res.status(400).json({ message: 'Tidak ada file gambar yang disediakan' });
    }

    // Update the user's profile image in the database
    const imagePath = `/uploads/profile-images/${req.file.filename}`;
    const updateQuery = 'UPDATE users SET profile_picture = ? WHERE id = ?';
    db.query(updateQuery, [imagePath, id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        message: 'Profile image updated successfully',
        profileImageUrl: imagePath
      });
    });
  });
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user.id == id) {
    return res.status(400).json({ message: 'Tidak dapat menghapus akun Anda sendiri' });
  }

  // First, delete related transactions
  const deleteTransactionsQuery = 'DELETE FROM transactions WHERE user_id = ?';
  db.query(deleteTransactionsQuery, [id], (err) => {
    if (err) {
      console.error('Error deleting user transactions:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Then delete the user
    const deleteUserQuery = 'DELETE FROM users WHERE id = ?';
    db.query(deleteUserQuery, [id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Pengguna berhasil dihapus' });
    });
  });
});

module.exports = router;