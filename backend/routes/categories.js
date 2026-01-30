// routes/categories.js
const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', sort_by = 'name', sort_order = 'ASC' } = req.query;
  const offset = (page - 1) * limit;

  // Validate sort_by and sort_order parameters
  const validSortBy = ['id', 'name', 'created_at'];
  const validSortOrder = ['ASC', 'DESC'];

  const sortBy = validSortBy.includes(sort_by) ? sort_by : 'name';
  const sortOrder = validSortOrder.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'ASC';

  let query = 'SELECT *, (SELECT COUNT(*) FROM books WHERE category_id = categories.id) as book_count FROM categories WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM categories WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    db.query(countQuery, countParams, (err, countResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        categories: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResults[0].total / limit),
          totalCategories: countResults[0].total,
          hasNextPage: page < Math.ceil(countResults[0].total / limit),
          hasPrevPage: page > 1
        }
      });
    });
  });
});

// Get category by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = 'SELECT *, (SELECT COUNT(*) FROM books WHERE category_id = categories.id) as book_count FROM categories WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    res.json({ category: results[0] });
  });
});

// Create new category (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { name, description } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Nama wajib diisi' });
  }

  // Check if category already exists
  const checkQuery = 'SELECT id FROM categories WHERE name = ?';
  db.query(checkQuery, [name], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Kategori dengan nama ini sudah ada' });
    }

    // Insert new category
    const insertQuery = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    db.query(insertQuery, [name, description || null], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get the created category
      const selectQuery = 'SELECT *, (SELECT COUNT(*) FROM books WHERE category_id = categories.id) as book_count FROM categories WHERE id = ?';
      db.query(selectQuery, [result.insertId], (err, categoryResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.status(201).json({
          message: 'Kategori berhasil dibuat',
          category: categoryResult[0]
        });
      });
    });
  });
});

// Update category (admin only)
router.put('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  // Check if category exists
  const checkQuery = 'SELECT id FROM categories WHERE id = ?';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    // Check if new name already exists for another category
    if (name) {
      const nameCheckQuery = 'SELECT id FROM categories WHERE name = ? AND id != ?';
      db.query(nameCheckQuery, [name, id], (err, nameResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (nameResults.length > 0) {
          return res.status(400).json({ message: 'Kategori dengan nama ini sudah ada' });
        }

        updateCategory(req, res);
      });
    } else {
      updateCategory(req, res);
    }
  });
});

function updateCategory(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;

  let updateFields = [];
  let params = [];

  if (name) {
    updateFields.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    params.push(description || null);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'Tidak ada bidang yang diperbarui' });
  }

  params.push(id);

  const updateQuery = `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`;
  db.query(updateQuery, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get updated category
    const selectQuery = 'SELECT *, (SELECT COUNT(*) FROM books WHERE category_id = categories.id) as book_count FROM categories WHERE id = ?';
    db.query(selectQuery, [id], (err, categoryResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        message: 'Kategori berhasil diperbarui',
        category: categoryResult[0]
      });
    });
  });
}

// Delete category (admin only)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;

  // First, check if the category exists
  const checkQuery = 'SELECT id FROM categories WHERE id = ?';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    // Update books that belong to this category to have no category (NULL category_id)
    const updateBooksQuery = 'UPDATE books SET category_id = NULL WHERE category_id = ?';
    db.query(updateBooksQuery, [id], (err, updateResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Now delete the category
      const deleteQuery = 'DELETE FROM categories WHERE id = ?';
      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        // This should not happen since we checked existence first, but keeping for safety
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Kategori berhasil dihapus' });
      });
    });
  });
});

module.exports = router;