// routes/books.js
const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all books with optional filters
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', category_id = '', sort_by = 'created_at', sort_order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT b.id, b.title, b.author, b.publication_year, b.isbn, b.category_id, b.available_copies, b.description, b.created_at, b.updated_at, c.name as category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category_id) {
    query += ' AND b.category_id = ?';
    params.push(category_id);
  }

  query += ` ORDER BY ${sort_by} ${sort_order} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category_id) {
      countQuery += ' AND b.category_id = ?';
      countParams.push(category_id);
    }

    db.query(countQuery, countParams, (err, countResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        books: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResults[0].total / limit),
          totalBooks: countResults[0].total,
          hasNextPage: page < Math.ceil(countResults[0].total / limit),
          hasPrevPage: page > 1
        }
      });
    });
  });
});

// Get book by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT b.id, b.title, b.author, b.publication_year, b.isbn, b.category_id, b.available_copies, b.description, b.created_at, b.updated_at, c.name as category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    res.json({ book: results[0] });
  });
});

// Create new book (admin only)
router.post('/', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { title, author, publication_year, isbn, category_id, description } = req.body;

  // Validate required fields
  if (!title || !author) {
    return res.status(400).json({ message: 'Judul dan penulis wajib diisi' });
  }

  // Check if ISBN already exists
  if (isbn) {
    const checkQuery = 'SELECT id FROM books WHERE isbn = ?';
    db.query(checkQuery, [isbn], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'ISBN sudah digunakan oleh buku lain' });
      }

      // Insert new book
      insertBook(req, res);
    });
  } else {
    insertBook(req, res);
  }
});

function insertBook(req, res) {
  const { title, author, publication_year, isbn, category_id, description } = req.body;

  const query = 'INSERT INTO books (title, author, publication_year, isbn, category_id, available_copies, description) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const params = [title, author, publication_year !== undefined && publication_year !== null && publication_year !== '' ? publication_year.toString() : null, isbn || null, category_id || null, 1, description || null];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get the created book
    const selectQuery = `
      SELECT b.id, b.title, b.author, b.publication_year, b.isbn, b.category_id, b.available_copies, b.description, b.created_at, b.updated_at, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `;
    db.query(selectQuery, [result.insertId], (err, bookResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(201).json({
        message: 'Buku berhasil dibuat',
        book: bookResult[0]
      });
    });
  });
}

// Update book (admin only)
router.put('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  const { title, author, publication_year, isbn, category_id, available_copies, description } = req.body;

  // Check if book exists
  const checkQuery = 'SELECT id, available_copies FROM books WHERE id = ?';
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const existingBook = results[0];

    // Check if ISBN already exists for another book
    if (isbn) {
      const isbnCheckQuery = 'SELECT id FROM books WHERE isbn = ? AND id != ?';
      db.query(isbnCheckQuery, [isbn, id], (err, isbnResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (isbnResults.length > 0) {
          return res.status(400).json({ message: 'ISBN sudah digunakan oleh buku lain' });
        }

        updateBook(req, res, existingBook);
      });
    } else {
      updateBook(req, res, existingBook);
    }
  });
});

function updateBook(req, res, existingBook) {
  const { id } = req.params;
  const { title, author, publication_year, isbn, category_id, available_copies, description } = req.body;

  let updateFields = [];
  let params = [];

  if (title) {
    updateFields.push('title = ?');
    params.push(title);
  }
  if (author) {
    updateFields.push('author = ?');
    params.push(author);
  }
  if (publication_year !== undefined) {
    updateFields.push('publication_year = ?');
    params.push(publication_year !== undefined && publication_year !== null && publication_year !== '' ? publication_year.toString() : null);
  }
  if (isbn !== undefined) {
    updateFields.push('isbn = ?');
    params.push(isbn || null);
  }
  if (category_id !== undefined) {
    updateFields.push('category_id = ?');
    params.push(category_id || null);
  }
  if (available_copies !== undefined) {
    updateFields.push('available_copies = ?');
    params.push(available_copies || 0);
  }
  if (description !== undefined) {
    updateFields.push('description = ?');
    params.push(description || null);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'Tidak ada bidang yang diperbarui' });
  }

  params.push(id);

  const updateQuery = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
  db.query(updateQuery, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get updated book
    const selectQuery = `
      SELECT b.id, b.title, b.author, b.publication_year, b.isbn, b.category_id, b.available_copies, b.description, b.created_at, b.updated_at, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `;
    db.query(selectQuery, [id], (err, bookResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        message: 'Buku berhasil diperbarui',
        book: bookResult[0]
      });
    });
  });
}

// Delete book (admin only)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;

  // Check if book has active transactions
  const checkTransactionsQuery = 'SELECT COUNT(*) as count FROM transactions WHERE book_id = ? AND status = "borrowed"';
  db.query(checkTransactionsQuery, [id], (err, transactionResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (transactionResults[0].count > 0) {
      return res.status(400).json({ message: 'Buku masih dipinjam tidak bisa dihapus' });
    }

    const query = 'DELETE FROM books WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Buku tidak ditemukan' });
      }

      res.json({ message: 'Buku berhasil dihapus' });
    });
  });
});

module.exports = router;