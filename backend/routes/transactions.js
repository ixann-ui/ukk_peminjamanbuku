// routes/transactions.js
const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all transactions with optional filters
router.get('/', authenticateToken, (req, res) => {
  const { page = 1, limit = 10, search = '', status = '', user_id = '', book_id = '', sort_by = 'created_at', sort_order = 'DESC' } = req.query;
  const offset = (page - 1) * limit;

  // Validate sort_by and sort_order parameters
  const validSortBy = ['id', 'user_name', 'book_title', 'borrow_date', 'due_date', 'return_date', 'status', 'created_at'];
  const validSortOrder = ['ASC', 'DESC'];

  const sortBy = validSortBy.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = validSortOrder.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

  let query = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.role as user_role, u.class as user_class, u.address as user_address, u.nisn as user_nisn, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ? OR b.author LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (user_id) {
    query += ' AND t.user_id = ?';
    params.push(user_id);
  }

  if (book_id) {
    query += ' AND t.book_id = ?';
    params.push(book_id);
  }

  // Students can only see their own transactions
  if (req.user.role === 'student') {
    query += ' AND t.user_id = ?';
    params.push(req.user.id);
  }

  query += ` ORDER BY t.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN books b ON t.book_id = b.id
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      countQuery += ' AND (u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ? OR b.author LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      countQuery += ' AND t.status = ?';
      countParams.push(status);
    }

    if (user_id) {
      countQuery += ' AND t.user_id = ?';
      countParams.push(user_id);
    }

    if (book_id) {
      countQuery += ' AND t.book_id = ?';
      countParams.push(book_id);
    }

    // Students can only see their own transactions
    if (req.user.role === 'student') {
      countQuery += ' AND t.user_id = ?';
      countParams.push(req.user.id);
    }

    db.query(countQuery, countParams, (err, countResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({
        transactions: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResults[0].total / limit),
          totalTransactions: countResults[0].total,
          hasNextPage: page < Math.ceil(countResults[0].total / limit),
          hasPrevPage: page > 1
        }
      });
    });
  });
});

// Get transaction by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.role as user_role, u.class as user_class, u.address as user_address, u.nisn as user_nisn, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    WHERE t.id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    // Check if user can access this transaction
    const transaction = results[0];
    if (req.user.role !== 'admin' && req.user.id != transaction.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ transaction: transaction });
  });
});

// Create new transaction (borrow a book) - Students can borrow, admins can do anything
router.post('/', authenticateToken, (req, res) => {
  const { user_id, book_id, due_date } = req.body;
  console.log('Received borrow request:', { user_id, book_id, due_date, role: req.user.role, userId: req.user.id });

  // If student is making the request, they can only borrow for themselves
  if (req.user.role === 'student') {
    if (user_id && user_id != req.user.id) {
      return res.status(403).json({ message: 'Students can only borrow books for themselves' });
    }
    // Use the authenticated user's ID
    const actual_user_id = req.user.id;
    console.log('Student borrowing for themselves:', actual_user_id);

    // Check if user already has this book borrowed
    const checkExistingQuery = 'SELECT id FROM transactions WHERE user_id = ? AND book_id = ? AND status = "borrowed"';
    db.query(checkExistingQuery, [actual_user_id, book_id], (err, existingResults) => {
      if (err) {
        console.error('Database error checking existing transaction:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      if (existingResults.length > 0) {
        return res.status(400).json({ message: 'Kamu sudah meminjam buku ini' });
      }

      console.log('Creating transaction for student...');
      createTransaction(req, res, actual_user_id, book_id);
    });
  } else {
    // Admin can borrow for any user
    if (!user_id || !book_id) {
      return res.status(400).json({ message: 'User ID and Book ID are required' });
    }
    console.log('Admin borrowing for user:', user_id);
    createTransaction(req, res, user_id, book_id);
  }
});

function createTransaction(req, res, user_id, book_id) {
  // Check if book is available
  const bookCheckQuery = 'SELECT id, title, available_copies FROM books WHERE id = ?';
  db.query(bookCheckQuery, [book_id], (err, bookResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (bookResults.length === 0) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const book = bookResults[0];
    if (book.available_copies <= 0) {
      return res.status(400).json({ message: 'Buku tidak tersedia untuk dipinjam' });
    }

    // Check if user exists
    const userCheckQuery = 'SELECT id, name FROM users WHERE id = ?';
    db.query(userCheckQuery, [user_id], (err, userResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
      }

      // Calculate due date - use provided due date or default to 14 days from borrow date
      const now = new Date();
      const borrowDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      let dueDateStr;

      if (req.body.due_date) {
        // Validate that the provided due date is not in the past
        const providedDueDate = new Date(req.body.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (providedDueDate < today) {
          return res.status(400).json({ message: 'Tanggal jatuh tempo tidak boleh di masa lalu' });
        }

        dueDateStr = req.body.due_date;
      } else {
        // Default to 14 days from borrow date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period
        dueDateStr = dueDate.getFullYear() + '-' + String(dueDate.getMonth() + 1).padStart(2, '0') + '-' + String(dueDate.getDate()).padStart(2, '0');
      }

      // Insert new transaction
      console.log('Attempting to insert transaction:', { user_id, book_id, borrowDate, dueDateStr });
      const insertQuery = 'INSERT INTO transactions (user_id, book_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [user_id, book_id, borrowDate, dueDateStr, 'borrowed'], (err, result) => {
        if (err) {
          console.error('Database error in transaction creation:', err);
          console.error('Query parameters:', [user_id, book_id, borrowDate, dueDateStr, 'borrowed']);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }

        // Decrease available copies
        console.log('Updating book available copies...');
        const updateBookQuery = 'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?';
        db.query(updateBookQuery, [book_id], (err, updateResult) => {
          if (err) {
            console.error('Database error updating book copies:', err);
            // Rollback transaction if possible
            return res.status(500).json({ message: 'Database error', error: err.message });
          }

          console.log('Successfully updated book copies, now fetching transaction...');
          // Get the created transaction
          const selectQuery = `
            SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN books b ON t.book_id = b.id
            WHERE t.id = ?
          `;
          db.query(selectQuery, [result.insertId], (err, transactionResult) => {
            if (err) {
              console.error('Database error fetching transaction:', err);
              return res.status(500).json({ message: 'Database error', error: err.message });
            }

            console.log('Transaction created successfully:', transactionResult[0]);
            res.status(201).json({
              message: 'Buku berhasil dipinjam',
              transaction: transactionResult[0]
            });
          });
        });
      });
    });
  });
}

// Return a book (admin or student who borrowed it)
router.put('/:id/return', authenticateToken, (req, res) => {
  const { id } = req.params;
  console.log('Return request for transaction ID:', id); // Debug log
  console.log('Authenticated user:', req.user); // Debug log

  // Get transaction details
  const getTransactionQuery = 'SELECT * FROM transactions WHERE id = ?';
  db.query(getTransactionQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    console.log('Transaction query results:', results.length); // Debug log

    if (results.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    const transaction = results[0];

    // Check permissions - only admin or the borrower can return the book
    if (req.user.role !== 'admin' && req.user.id != transaction.user_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if already returned
    if (transaction.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    // Update transaction
    const returnDate = new Date().toISOString().split('T')[0];
    const updateTransactionQuery = 'UPDATE transactions SET return_date = ?, status = ? WHERE id = ?';
    db.query(updateTransactionQuery, [returnDate, 'returned', id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Increase available copies
      const updateBookQuery = 'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?';
      db.query(updateBookQuery, [transaction.book_id], (err, updateResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        // Get updated transaction
        const selectQuery = `
          SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN books b ON t.book_id = b.id
          WHERE t.id = ?
        `;
        db.query(selectQuery, [id], (err, transactionResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
          }

          res.json({
            message: 'Book returned successfully',
            transaction: transactionResult[0]
          });
        });
      });
    });
  });
});

// Extend due date (admin only)
router.put('/:id/extend', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;

  // Get transaction details
  const getTransactionQuery = 'SELECT * FROM transactions WHERE id = ? AND status = "borrowed"';
  db.query(getTransactionQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Transaksi aktif tidak ditemukan' });
    }

    const transaction = results[0];

    // Extend due date by 7 days
    const newDueDate = new Date(transaction.due_date);
    newDueDate.setDate(newDueDate.getDate() + 7);
    const newDueDateStr = newDueDate.toISOString().split('T')[0];

    // Update transaction
    const updateQuery = 'UPDATE transactions SET due_date = ? WHERE id = ?';
    db.query(updateQuery, [newDueDateStr, id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get updated transaction
      const selectQuery = `
        SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN books b ON t.book_id = b.id
        WHERE t.id = ?
      `;
      db.query(selectQuery, [id], (err, transactionResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          message: 'Tanggal jatuh tempo berhasil diperpanjang',
          transaction: transactionResult[0]
        });
      });
    });
  });
});

// Delete a transaction (admin only)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;

  // Get transaction details to check status
  const getTransactionQuery = 'SELECT * FROM transactions WHERE id = ?';
  db.query(getTransactionQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    const transaction = results[0];

    // Only allow deletion of returned transactions to maintain data integrity
    if (transaction.status !== 'returned') {
      return res.status(400).json({ message: 'Hanya transaksi yang sudah dikembalikan yang dapat dihapus' });
    }

    // Delete the transaction
    const deleteQuery = 'DELETE FROM transactions WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      res.json({ message: 'Transaksi berhasil dihapus' });
    });
  });
});

// Clear activities (all returned transactions, and overdue transactions older than 30 days) - admin and student
router.delete('/activities/clear', authenticateToken, (req, res) => {
  // Check if user is admin or student
  if (req.user.role !== 'admin' && req.user.role !== 'student') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // Delete all returned transactions (regardless of age) and old overdue transactions
  // Admin can delete all, student can only delete their own
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

  let deleteQuery, queryParams;
  if (req.user.role === 'admin') {
    // Admin can delete all returned transactions and old overdue transactions
    deleteQuery = 'DELETE FROM transactions WHERE status = "returned" OR (status = "overdue" AND created_at < ?)';
    queryParams = [dateStr];
  } else {
    // Student can only delete their own returned transactions and old overdue transactions
    deleteQuery = 'DELETE FROM transactions WHERE user_id = ? AND (status = "returned" OR (status = "overdue" AND created_at < ?))';
    queryParams = [req.user.id, dateStr];
  }

  db.query(deleteQuery, queryParams, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({
      message: `Berhasil menghapus ${result.affectedRows} aktivitas`,
      deletedCount: result.affectedRows
    });
  });
});

module.exports = router;