// routes/transactions.js
const express = require("express");
const db = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Get all transactions with optional filters
router.get("/", authenticateToken, (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    user_id = "",
    book_id = "",
    sort_by = "created_at",
    sort_order = "DESC",
  } = req.query;
  const offset = (page - 1) * limit;

  // Validate sort_by and sort_order parameters
  const validSortBy = [
    "id",
    "user_name",
    "book_title",
    "borrow_date",
    "due_date",
    "return_date",
    "status",
    "fine_amount",
    "created_at",
  ];
  const validSortOrder = ["ASC", "DESC"];

  const sortBy = validSortBy.includes(sort_by) ? sort_by : "created_at";
  const sortOrder = validSortOrder.includes(sort_order.toUpperCase())
    ? sort_order.toUpperCase()
    : "DESC";

  let query = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.role as user_role, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query +=
      " AND (u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ? OR b.author LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }

  if (user_id) {
    query += " AND t.user_id = ?";
    params.push(user_id);
  }

  if (book_id) {
    query += " AND t.book_id = ?";
    params.push(book_id);
  }

  // Students can only see their own transactions
  if (req.user.role === "student") {
    query += " AND t.user_id = ?";
    params.push(req.user.id);
  }

  query += ` ORDER BY t.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
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
      countQuery +=
        " AND (u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ? OR b.author LIKE ?)";
      countParams.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      );
    }

    if (status) {
      countQuery += " AND t.status = ?";
      countParams.push(status);
    }

    if (user_id) {
      countQuery += " AND t.user_id = ?";
      countParams.push(user_id);
    }

    if (book_id) {
      countQuery += " AND t.book_id = ?";
      countParams.push(book_id);
    }

    // Students can only see their own transactions
    if (req.user.role === "student") {
      countQuery += " AND t.user_id = ?";
      countParams.push(req.user.id);
    }

    db.query(countQuery, countParams, (err, countResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        transactions: results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResults[0].total / limit),
          totalTransactions: countResults[0].total,
          hasNextPage: page < Math.ceil(countResults[0].total / limit),
          hasPrevPage: page > 1,
        },
      });
    });
  });
});

// Get transaction by ID
router.get("/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.role as user_role, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    WHERE t.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    // Check if user can access this transaction
    const transaction = results[0];
    if (req.user.role !== "admin" && req.user.id != transaction.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ transaction: transaction });
  });
});

// Create new transaction (borrow a book) - Students can borrow, admins can do anything
router.post("/", authenticateToken, (req, res) => {
  const { user_id, book_id, due_date, quantity } = req.body;
  console.log("Received borrow request:", {
    user_id,
    book_id,
    due_date,
    quantity,
    role: req.user.role,
    userId: req.user.id,
  });

  // If student is making the request, they can only borrow for themselves
  if (req.user.role === "student") {
    if (user_id && user_id != req.user.id) {
      return res
        .status(403)
        .json({ message: "Students can only borrow books for themselves" });
    }
    // Use the authenticated user's ID
    const actual_user_id = req.user.id;
    console.log("Student requesting to borrow for themselves:", actual_user_id);

    // Check if user already has this book borrowed (but allow multiple pending requests)
    const checkExistingQuery =
      'SELECT id FROM transactions WHERE user_id = ? AND book_id = ? AND status = "borrowed"';
    db.query(
      checkExistingQuery,
      [actual_user_id, book_id],
      (err, existingResults) => {
        if (err) {
          console.error("Database error checking existing transaction:", err);
          return res
            .status(500)
            .json({ message: "Database error", error: err.message });
        }

        if (existingResults.length > 0) {
          return res
            .status(400)
            .json({ message: "Kamu sudah meminjam buku ini" });
        }

        console.log("Creating pending transaction for student...");
        createPendingTransaction(
          req,
          res,
          actual_user_id,
          book_id,
          Number(quantity) || 1,
        );
      },
    );
  } else {
    // All borrowing requests should go through approval for accountability
    // Even admin-initiated requests need approval
    if (!user_id || !book_id) {
      return res
        .status(400)
        .json({ message: "User ID and Book ID are required" });
    }
    console.log("Admin creating pending transaction for user:", user_id);
    createPendingTransaction(req, res, user_id, book_id, Number(quantity) || 1);
  }
});

function createTransaction(
  req,
  res,
  user_id,
  book_id,
  status = "borrowed",
  quantity = 1,
) {
  // Ensure status is a valid non-empty string
  const finalStatus =
    status && String(status).trim() !== "" ? status : "pending";
  // Check if book is available
  const bookCheckQuery =
    "SELECT id, title, available_copies FROM books WHERE id = ?";
  db.query(bookCheckQuery, [book_id], (err, bookResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (bookResults.length === 0) {
      return res.status(404).json({ message: "Buku tidak ditemukan" });
    }

    const book = bookResults[0];

    // For pending requests, don't check available copies yet
    if (finalStatus === "borrowed" && book.available_copies <= 0) {
      return res
        .status(400)
        .json({ message: "Buku tidak tersedia untuk dipinjam" });
    }

    // Check if user exists and get their max borrow limit
    const userCheckQuery =
      "SELECT id, name, max_borrow_limit FROM users WHERE id = ?";
    db.query(userCheckQuery, [user_id], (err, userResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }

      const user = userResults[0];
      const maxBorrowLimit = user.max_borrow_limit || 5; // Default to 5 if not set

      // For pending requests, don't check borrowing limits yet
      if (finalStatus === "borrowed") {
        // Check how many books the user currently has borrowed
        const borrowedCountQuery =
          'SELECT COUNT(*) as borrowed_count FROM transactions WHERE user_id = ? AND status = "borrowed"';
        db.query(borrowedCountQuery, [user_id], (err, countResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          const borrowedCount = countResults[0].borrowed_count;

          // Check if user has reached their borrowing limit
          if (borrowedCount >= maxBorrowLimit) {
            return res.status(400).json({
              message: `Pengguna telah mencapai batas peminjaman maksimal (${maxBorrowLimit} buku)`,
            });
          }

          createTransactionRecord(
            req,
            res,
            user_id,
            book_id,
            status,
            book,
            quantity,
          );
        });
      } else {
        // For pending requests, just create the record
        createTransactionRecord(
          req,
          res,
          user_id,
          book_id,
          finalStatus,
          book,
          quantity,
        );
      }
    });
  });
}

function createTransactionRecord(
  req,
  res,
  user_id,
  book_id,
  status,
  book,
  quantity = 1,
) {
  // guard against empty status
  const insertStatus =
    status && String(status).trim() !== "" ? status : "pending";
  // Calculate due date - use provided due date or default to 14 days from borrow date
  const now = new Date();
  const borrowDate =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");
  let dueDateStr;

  if (req.body.due_date) {
    // Validate that the provided due date is not in the past
    const providedDueDate = new Date(req.body.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (providedDueDate < today) {
      return res
        .status(400)
        .json({ message: "Tanggal jatuh tempo tidak boleh di masa lalu" });
    }

    dueDateStr = req.body.due_date;
  } else {
    // Default to 14 days from borrow date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period
    dueDateStr =
      dueDate.getFullYear() +
      "-" +
      String(dueDate.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(dueDate.getDate()).padStart(2, "0");
  }

  // Insert new transaction
  console.log("Attempting to insert transaction:", {
    user_id,
    book_id,
    borrowDate,
    dueDateStr,
    status: insertStatus,
    quantity,
  });
  const insertQuery =
    "INSERT INTO transactions (user_id, book_id, borrow_date, due_date, status, fine_amount, quantity) VALUES (?, ?, ?, ?, ?, 0.00, ?)";
  db.query(
    insertQuery,
    [user_id, book_id, borrowDate, dueDateStr, insertStatus, quantity],
    (err, result) => {
      if (err) {
        console.error("Database error in transaction creation:", err);
        console.error("Query parameters:", [
          user_id,
          book_id,
          borrowDate,
          dueDateStr,
          insertStatus,
        ]);
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }

      // Only decrease available copies if the status is 'borrowed' (not for pending requests)
      if (status === "borrowed") {
        console.log("Updating book available copies...");
        const updateBookQuery =
          "UPDATE books SET available_copies = available_copies - ? WHERE id = ?";
        db.query(updateBookQuery, [quantity, book_id], (err, updateResult) => {
          if (err) {
            console.error("Database error updating book copies:", err);
            // Rollback transaction if possible
            return res
              .status(500)
              .json({ message: "Database error", error: err.message });
          }

          console.log(
            "Successfully updated book copies, now fetching transaction...",
          );
          fetchAndReturnTransaction(result.insertId, res);
        });
      } else {
        console.log(
          "Pending transaction created successfully:",
          result.insertId,
        );
        fetchAndReturnTransaction(result.insertId, res);
      }
    },
  );
}

function createPendingTransaction(req, res, user_id, book_id, quantity = 1) {
  // Create a pending transaction without affecting book availability
  createTransaction(req, res, user_id, book_id, "pending", quantity);
}

function fetchAndReturnTransaction(transactionId, res) {
  // Get the created transaction
  const selectQuery = `
    SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    WHERE t.id = ?
  `;
  db.query(selectQuery, [transactionId], (err, transactionResult) => {
    if (err) {
      console.error("Database error fetching transaction:", err);
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }

    console.log("Transaction created successfully:", transactionResult[0]);
    res.status(201).json({
      message:
        transactionResult[0].status === "pending"
          ? "Permintaan peminjaman buku berhasil diajukan, menunggu persetujuan admin"
          : "Buku berhasil dipinjam",
      transaction: transactionResult[0],
    });
  });
}

// Helper function to calculate fine amount
function calculateFine(dueDate, returnDate) {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  // Set time to 00:00:00 for accurate day comparison
  due.setHours(0, 0, 0, 0);
  returned.setHours(0, 0, 0, 0);

  // Calculate difference in days
  const timeDiff = returned.getTime() - due.getTime();
  const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

  // If returned on or before due date, no fine
  if (dayDiff <= 0) {
    return 0;
  }

  // Fine is 1000 per day of delay
  return dayDiff * 1000;
}

// Helper function to update overdue transactions status and calculate fines
function updateOverdueTransactions() {
  const today = new Date();
  // Set time to 00:00:00 to compare only dates, not times
  today.setHours(0, 0, 0, 0);
  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // First, get all transactions that should be overdue (past due date and currently borrowed)
  const getOverdueQuery = `
    SELECT id, due_date FROM transactions
    WHERE status = 'borrowed' AND due_date < ?
  `;

  db.query(getOverdueQuery, [todayStr], (err, results) => {
    if (err) {
      console.error("Error fetching overdue transactions:", err);
      return;
    }

    // Process each overdue transaction to update its status and fine
    results.forEach((transaction) => {
      // Calculate fine amount using today's date as the reference for calculation
      const fineAmount = calculateFine(transaction.due_date, todayStr);

      // Update the status to overdue and fine amount for this transaction
      const updateQuery =
        "UPDATE transactions SET status = 'overdue', fine_amount = ? WHERE id = ?";
      db.query(
        updateQuery,
        [fineAmount, transaction.id],
        (err, updateResult) => {
          if (err) {
            console.error(
              "Error updating overdue transaction",
              transaction.id,
              ":",
              err,
            );
          } else if (updateResult.affectedRows > 0) {
            console.log(
              `Updated transaction ${transaction.id} to overdue status with fine of Rp ${fineAmount}`,
            );
          }
        },
      );
    });
  });

  // Additionally, for transactions already marked as 'overdue', update their fine amounts if they've been overdue longer
  const updateExistingOverdueQuery = `
    SELECT id, due_date FROM transactions
    WHERE status = 'overdue' AND due_date < ?
  `;

  db.query(updateExistingOverdueQuery, [todayStr], (err, results) => {
    if (err) {
      console.error("Error fetching existing overdue transactions:", err);
      return;
    }

    // Process each existing overdue transaction to update its fine
    results.forEach((transaction) => {
      // Calculate fine amount using today's date as the reference for calculation
      const fineAmount = calculateFine(transaction.due_date, todayStr);

      // Update the fine amount for this transaction
      const updateFineQuery =
        "UPDATE transactions SET fine_amount = ? WHERE id = ?";
      db.query(
        updateFineQuery,
        [fineAmount, transaction.id],
        (err, updateResult) => {
          if (err) {
            console.error(
              "Error updating fine amount for existing overdue transaction",
              transaction.id,
              ":",
              err,
            );
          } else if (updateResult.affectedRows > 0) {
            console.log(
              `Updated fine amount for existing overdue transaction ${transaction.id}: Rp ${fineAmount}`,
            );
          }
        },
      );
    });
  });
}

// Run the overdue update function every hour
setInterval(updateOverdueTransactions, 60 * 60 * 1000); // Every hour
// Also run once when the server starts
updateOverdueTransactions();

// Return a book (admin or student who borrowed it)
router.put("/:id/return", authenticateToken, (req, res) => {
  const { id } = req.params;
  console.log("Return request for transaction ID:", id); // Debug log
  console.log("Authenticated user:", req.user); // Debug log

  // Get transaction details
  const getTransactionQuery = "SELECT * FROM transactions WHERE id = ?";
  db.query(getTransactionQuery, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    console.log("Transaction query results:", results.length); // Debug log

    if (results.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    const transaction = results[0];

    // Check permissions - only admin or the borrower can return the book
    if (req.user.role !== "admin" && req.user.id != transaction.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if already returned
    if (transaction.status === "returned") {
      return res.status(400).json({ message: "Book already returned" });
    }

    // Update transaction
    // Use provided return timestamp if present (frontend may send), otherwise use current time
    const providedReturnTimestamp = req.body && req.body.return_timestamp;
    const returnTimestamp = providedReturnTimestamp
      ? new Date(providedReturnTimestamp)
      : new Date();

    // Build DB datetime string 'YYYY-MM-DD HH:MM:SS' for storage
    const yyyy = returnTimestamp.getFullYear();
    const mm = String(returnTimestamp.getMonth() + 1).padStart(2, "0");
    const dd = String(returnTimestamp.getDate()).padStart(2, "0");
    const hh = String(returnTimestamp.getHours()).padStart(2, "0");
    const min = String(returnTimestamp.getMinutes()).padStart(2, "0");
    const ss = String(returnTimestamp.getSeconds()).padStart(2, "0");
    const returnDateTimeForDb = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

    // Calculate fine amount using date-only comparison (preserve existing logic)
    const returnDateOnly = `${yyyy}-${mm}-${dd}`;
    const fineAmount = calculateFine(transaction.due_date, returnDateOnly);

    const updateTransactionQuery =
      "UPDATE transactions SET return_date = ?, status = ?, fine_amount = ? WHERE id = ?";
    db.query(
      updateTransactionQuery,
      [returnDateTimeForDb, "returned", fineAmount, id],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        // Increase available copies
        const qty = Number(transaction.quantity) || 1;
        const updateBookQuery =
          "UPDATE books SET available_copies = available_copies + ? WHERE id = ?";
        db.query(
          updateBookQuery,
          [qty, transaction.book_id],
          (err, updateResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Database error" });
            }

            // Get updated transaction
            const selectQuery = `
          SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN books b ON t.book_id = b.id
          WHERE t.id = ?
        `;
            db.query(selectQuery, [id], (err, transactionResult) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
              }

              res.json({
                message:
                  fineAmount > 0
                    ? `Book returned successfully. Fine: Rp. ${fineAmount.toLocaleString()}`
                    : "Book returned successfully",
                fine_amount: fineAmount,
                transaction: transactionResult[0],
              });
            });
          },
        );
      },
    );
  });
});

// Extend due date (admin only)
router.put(
  "/:id/extend",
  authenticateToken,
  authorizeRole(["admin"]),
  (req, res) => {
    const { id } = req.params;
    // Be tolerant: coerce days to number and accept numeric strings
    const rawDays = req.body && req.body.days;
    const days = Number(rawDays) || 7; // Default to 7 days if not specified or invalid

    // Validate days parameter
    const validDays = [1, 3, 7];
    if (!validDays.includes(days)) {
      return res.status(400).json({
        message: "Durasi perpanjangan tidak valid. Gunakan 1, 3, atau 7 hari.",
      });
    }

    // Get transaction details - allow extending if currently borrowed or overdue
    const getTransactionQuery =
      "SELECT * FROM transactions WHERE id = ? AND status IN ('borrowed','overdue')";
    db.query(getTransactionQuery, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "Transaksi aktif tidak ditemukan" });
      }

      const transaction = results[0];

      console.log(
        `Extending transaction ${id} due_date (${transaction.due_date}) by ${days} days`,
      );

      // Extend due date by specified days
      const newDueDate = new Date(transaction.due_date);
      newDueDate.setDate(newDueDate.getDate() + days);
      const ny = newDueDate.getFullYear();
      const nm = String(newDueDate.getMonth() + 1).padStart(2, "0");
      const nd = String(newDueDate.getDate()).padStart(2, "0");
      const newDueDateStr = `${ny}-${nm}-${nd}`;

      // Update transaction
      const updateQuery = "UPDATE transactions SET due_date = ? WHERE id = ?";
      db.query(updateQuery, [newDueDateStr, id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        // After updating due date, recalculate fine and status based on today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr =
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0");

        const fineAmount = calculateFine(newDueDateStr, todayStr);
        const newStatus = fineAmount > 0 ? "overdue" : "borrowed";

        const updateFineQuery =
          "UPDATE transactions SET fine_amount = ?, status = ? WHERE id = ?";
        db.query(updateFineQuery, [fineAmount, newStatus, id], (err) => {
          if (err) {
            console.error(
              "Error updating fine/status after extending due date:",
              err,
            );
            return res.status(500).json({ message: "Database error" });
          }

          // Get updated transaction
          const selectQuery = `
          SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN books b ON t.book_id = b.id
          WHERE t.id = ?
        `;
          db.query(selectQuery, [id], (err, transactionResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Database error" });
            }

            res.json({
              message: `Tanggal jatuh tempo berhasil diperpanjang ${days} hari`,
              transaction: transactionResult[0],
            });
          });
        });
      });
    });
  },
);

// Admin: update a transaction's due date manually and recalculate fine/status
router.put(
  "/:id/update-due-date",
  authenticateToken,
  authorizeRole(["admin"]),
  (req, res) => {
    const { id } = req.params;
    const { due_date } = req.body;

    if (!due_date) {
      return res.status(400).json({ message: "due_date is required" });
    }

    // Validate date
    const newDue = new Date(due_date);
    if (isNaN(newDue.getTime())) {
      return res.status(400).json({ message: "Invalid due_date format" });
    }

    const ny = newDue.getFullYear();
    const nm = String(newDue.getMonth() + 1).padStart(2, "0");
    const nd = String(newDue.getDate()).padStart(2, "0");
    const newDueDateStr = `${ny}-${nm}-${nd}`;

    // Ensure transaction exists
    const getTransactionQuery = "SELECT * FROM transactions WHERE id = ?";
    db.query(getTransactionQuery, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      // Update due_date
      const updateQuery = "UPDATE transactions SET due_date = ? WHERE id = ?";
      db.query(updateQuery, [newDueDateStr, id], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        // Recalculate fine and status based on today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr =
          today.getFullYear() +
          "-" +
          String(today.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(today.getDate()).padStart(2, "0");

        const fineAmount = calculateFine(newDueDateStr, todayStr);
        const newStatus = fineAmount > 0 ? "overdue" : "borrowed";

        const updateFineQuery =
          "UPDATE transactions SET fine_amount = ?, status = ? WHERE id = ?";
        db.query(updateFineQuery, [fineAmount, newStatus, id], (err) => {
          if (err) {
            console.error(
              "Error updating fine/status after due date change:",
              err,
            );
            return res.status(500).json({ message: "Database error" });
          }

          // Return updated transaction
          const selectQuery = `
          SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
          FROM transactions t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN books b ON t.book_id = b.id
          WHERE t.id = ?
        `;
          db.query(selectQuery, [id], (err, transactionResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Database error" });
            }

            res.json({
              message: "Due date updated and fine/status recalculated",
              transaction: transactionResult[0],
            });
          });
        });
      });
    });
  },
);

// Delete a transaction (admin only)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  (req, res) => {
    const { id } = req.params;

    // Get transaction details to check status
    const getTransactionQuery = "SELECT * FROM transactions WHERE id = ?";
    db.query(getTransactionQuery, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      const transaction = results[0];

      // Only allow deletion of returned, rejected, or overdue transactions to maintain data integrity
      if (
        transaction.status !== "returned" &&
        transaction.status !== "rejected" &&
        transaction.status !== "overdue"
      ) {
        return res.status(400).json({
          message:
            "Hanya transaksi yang sudah dikembalikan, ditolak, atau terlambat yang dapat dihapus",
        });
      }

      // Delete the transaction
      const deleteQuery = "DELETE FROM transactions WHERE id = ?";
      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        res.json({ message: "Transaksi berhasil dihapus" });
      });
    });
  },
);

// Clear activities (all returned transactions, and overdue transactions older than 30 days) - admin and student
router.delete("/activities/clear", authenticateToken, (req, res) => {
  // Check if user is admin or student
  if (req.user.role !== "admin" && req.user.role !== "student") {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  // Delete all returned transactions (regardless of age) and old overdue transactions
  // Admin can delete all, student can only delete their own
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().slice(0, 19).replace("T", " ");

  let deleteQuery, queryParams;
  if (req.user.role === "admin") {
    // Admin can delete all returned transactions and old overdue transactions
    deleteQuery =
      'DELETE FROM transactions WHERE status = "returned" OR status = "rejected" OR (status = "overdue" AND created_at < ?)';
    queryParams = [dateStr];
  } else {
    // Student can only delete their own returned transactions and old overdue transactions
    deleteQuery =
      'DELETE FROM transactions WHERE user_id = ? AND (status = "returned" OR status = "rejected" OR (status = "overdue" AND created_at < ?))';
    queryParams = [req.user.id, dateStr];
  }

  db.query(deleteQuery, queryParams, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({
      message: `Berhasil menghapus ${result.affectedRows} aktivitas`,
      deletedCount: result.affectedRows,
    });
  });
});

// Approve a pending transaction
router.put(
  "/:id/approve",
  authenticateToken,
  authorizeRole(["admin"]),
  (req, res) => {
    const { id } = req.params;

    // Get transaction details
    const getTransactionQuery = "SELECT * FROM transactions WHERE id = ?";
    db.query(getTransactionQuery, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      const transaction = results[0];

      // Check if transaction is in pending status
      if (transaction.status !== "pending") {
        return res.status(400).json({
          message:
            "Hanya permintaan peminjaman yang menunggu yang bisa disetujui",
        });
      }

      // Check if user already has this specific book borrowed (prevent duplicate borrowing of same book)
      const checkDuplicateQuery =
        'SELECT id FROM transactions WHERE user_id = ? AND book_id = ? AND status = "borrowed"';
      db.query(
        checkDuplicateQuery,
        [transaction.user_id, transaction.book_id],
        (err, duplicateResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          if (duplicateResults.length > 0) {
            return res
              .status(400)
              .json({ message: "Pengguna sudah meminjam buku ini" });
          }

          // Check if book is available
          const bookCheckQuery =
            "SELECT available_copies FROM books WHERE id = ?";
          db.query(
            bookCheckQuery,
            [transaction.book_id],
            (err, bookResults) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
              }

              if (bookResults.length === 0) {
                return res
                  .status(404)
                  .json({ message: "Buku tidak ditemukan" });
              }

              const book = bookResults[0];
              if (book.available_copies <= 0) {
                return res
                  .status(400)
                  .json({ message: "Buku tidak tersedia untuk dipinjam" });
              }

              // Check if user has reached their borrowing limit
              const userCheckQuery =
                "SELECT max_borrow_limit FROM users WHERE id = ?";
              db.query(
                userCheckQuery,
                [transaction.user_id],
                (err, userResults) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Database error" });
                  }

                  if (userResults.length === 0) {
                    return res
                      .status(404)
                      .json({ message: "Pengguna tidak ditemukan" });
                  }

                  const user = userResults[0];
                  const maxBorrowLimit = user.max_borrow_limit || 5; // Default to 5 if not set

                  // Check how many books the user currently has borrowed
                  const borrowedCountQuery =
                    'SELECT COUNT(*) as borrowed_count FROM transactions WHERE user_id = ? AND status = "borrowed"';
                  db.query(
                    borrowedCountQuery,
                    [transaction.user_id],
                    (err, countResults) => {
                      if (err) {
                        console.error(err);
                        return res
                          .status(500)
                          .json({ message: "Database error" });
                      }

                      const borrowedCount = countResults[0].borrowed_count;

                      // Check if user has reached their borrowing limit
                      if (borrowedCount >= maxBorrowLimit) {
                        return res.status(400).json({
                          message: `Pengguna telah mencapai batas peminjaman maksimal (${maxBorrowLimit} buku)`,
                        });
                      }

                      // Update transaction status to borrowed
                      const updateTransactionQuery =
                        "UPDATE transactions SET status = ? WHERE id = ?";
                      db.query(
                        updateTransactionQuery,
                        ["borrowed", id],
                        (err, result) => {
                          if (err) {
                            console.error(err);
                            return res
                              .status(500)
                              .json({ message: "Database error" });
                          }

                          // Decrease available copies by the transaction quantity
                          const qty = Number(transaction.quantity) || 1;
                          const updateBookQuery =
                            "UPDATE books SET available_copies = available_copies - ? WHERE id = ?";
                          db.query(
                            updateBookQuery,
                            [qty, transaction.book_id],
                            (err, updateResult) => {
                              if (err) {
                                console.error(err);
                                return res
                                  .status(500)
                                  .json({ message: "Database error" });
                              }

                              // Get updated transaction
                              const selectQuery = `
                  SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
                  FROM transactions t
                  LEFT JOIN users u ON t.user_id = u.id
                  LEFT JOIN books b ON t.book_id = b.id
                  WHERE t.id = ?
                `;
                              db.query(
                                selectQuery,
                                [id],
                                (err, transactionResult) => {
                                  if (err) {
                                    console.error(err);
                                    return res
                                      .status(500)
                                      .json({ message: "Database error" });
                                  }

                                  res.json({
                                    message:
                                      "Permintaan peminjaman berhasil disetujui",
                                    transaction: transactionResult[0],
                                  });
                                },
                              );
                            },
                          );
                        },
                      );
                    },
                  );
                },
              );
            },
          );
        },
      );
    });
  },
);

// Reject a pending transaction
router.put(
  "/:id/reject",
  authenticateToken,
  authorizeRole(["admin"]),
  (req, res) => {
    const { id } = req.params;

    // Get transaction details
    const getTransactionQuery = "SELECT * FROM transactions WHERE id = ?";
    db.query(getTransactionQuery, [id], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan" });
      }

      const transaction = results[0];

      // Check if transaction is in pending status
      if (transaction.status !== "pending") {
        return res.status(400).json({
          message:
            "Hanya permintaan peminjaman yang menunggu yang bisa ditolak",
        });
      }

      // Mark transaction as rejected so it remains visible for admin to delete
      const updateTransactionQuery =
        "UPDATE transactions SET status = ? WHERE id = ?";
      db.query(updateTransactionQuery, ["rejected", id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Transaksi tidak ditemukan" });
        }

        // Return the updated transaction with joins
        const selectQuery = `
            SELECT t.*, u.name as user_name, u.email as user_email, u.class as user_class, u.address as user_address, u.nisn as user_nisn, u.phone_number, u.max_borrow_limit, b.title as book_title, b.author as book_author, b.publication_year as book_publication_year
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN books b ON t.book_id = b.id
            WHERE t.id = ?
          `;
        db.query(selectQuery, [id], (err, transactionResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          res.json({
            message: "Permintaan peminjaman berhasil ditolak",
            transaction: transactionResult[0],
          });
        });
      });
    });
  },
);

module.exports = router;
