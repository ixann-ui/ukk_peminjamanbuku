// app/student/borrow/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Card from "../../../components/Card";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import InputField from "../../../components/InputField";
import Receipt from "../../../components/Receipt";
import Notification from "../../../components/Notification";
import ConfirmationCheckbox from "../../../components/ConfirmationCheckbox";
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  CalendarIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AnimatedButton from "../../../components/AnimatedButton";

const BorrowBooksPage = () => {
  const { token, user } = useAuth();
  const [books, setBooks] = useState([]);
  const [pendingReservations, setPendingReservations] = useState({}); // { transactionId: quantity }
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showBookDetailsModal, setShowBookDetailsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("success");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowForm, setBorrowForm] = useState({
    due_date: "",
    due_time: "07:00", // Default to 7:00 AM
  });
  const [maxQuantity, setMaxQuantity] = useState(1);
  const MAX_PER_STUDENT = 5;
  const [borrowedTransaction, setBorrowedTransaction] = useState(null);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [token, searchTerm, selectedCategory]);

  // Listen for approve/reject events to adjust available copies
  useEffect(() => {
    const handler = (e) => {
      try {
        const { action, transaction } = e.detail || {};
        if (!transaction) return;

        const txId = transaction.id;
        const bookId =
          transaction.book_id || transaction.bookId || transaction.book?.id;
        const qty = Number(transaction.quantity || transaction.qty || 1);

        if (action === "reject") {
          // If we had a pending reservation for this transaction, restore copies
          setPendingReservations((prev) => {
            if (!prev[txId]) return prev;
            const reservedQty = prev[txId];
            setBooks((bprev) =>
              bprev.map((b) =>
                b.id === bookId
                  ? {
                      ...b,
                      available_copies: (b.available_copies || 0) + reservedQty,
                    }
                  : b,
              ),
            );
            const copy = { ...prev };
            delete copy[txId];
            return copy;
          });
        } else if (action === "approve") {
          // If we had a pending reservation, remove it (copies already decremented on request)
          setPendingReservations((prev) => {
            if (prev[txId]) {
              const copy = { ...prev };
              delete copy[txId];
              return copy;
            }
            // Otherwise, reduce available copies globally by qty
            if (bookId) {
              setBooks((bprev) =>
                bprev.map((b) =>
                  b.id === bookId
                    ? {
                        ...b,
                        available_copies: Math.max(
                          0,
                          (b.available_copies || 0) - qty,
                        ),
                      }
                    : b,
                ),
              );
            }
            return prev;
          });
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("transactionAction", handler);
    return () => window.removeEventListener("transactionAction", handler);
  }, [setBooks]);

  const fetchBooks = async () => {
    try {
      let url = `http://localhost:5000/api/books?search=${searchTerm}`;
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Filter books to only show those with available copies
      const availableBooks = (data.books || []).filter(
        (book) => book.available_copies > 0,
      );
      setBooks(availableBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleBorrowBook = (book) => {
    setSelectedBook(book);
    // Set default due date to 14 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    const formattedDate = defaultDueDate.toISOString().split("T")[0];
    setBorrowForm({ due_date: formattedDate, due_time: "07:00", quantity: 1 });
    // compute max quantity allowed based on availability and student's current active borrows
    (async () => {
      try {
        const resp = await fetch(
          `http://localhost:5000/api/transactions?user_id=${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await resp.json();
        const activeCount = (data.transactions || []).filter(
          (t) => t.status === "borrowed" || t.status === "overdue",
        ).length;
        const remaining = Math.max(0, MAX_PER_STUDENT - activeCount);
        const allowed = Math.max(
          0,
          Math.min(book.available_copies || 0, remaining),
        );
        setMaxQuantity(allowed || 0);
        // adjust default quantity if allowed is less than 1
        setBorrowForm((prev) => ({ ...prev, quantity: allowed >= 1 ? 1 : 0 }));
      } catch (err) {
        console.error("Error computing max quantity", err);
        const allowed = Math.min(book.available_copies || 0, MAX_PER_STUDENT);
        setMaxQuantity(allowed);
      }
    })();
    setShowBorrowModal(true);
  };

  const handleConfirmBorrow = () => {
    if (!borrowForm.due_date) {
      // Show error notification
      setNotificationMessage("Silakan pilih tanggal jatuh tempo");
      setNotificationType("error");
      setShowNotification(true);
      return;
    }

    // Validate quantity
    const qty = Number(borrowForm.quantity || 0);
    if (!qty || qty < 1) {
      setNotificationMessage("Jumlah minimal peminjaman adalah 1");
      setNotificationType("error");
      setShowNotification(true);
      return;
    }
    if (qty > maxQuantity) {
      setNotificationMessage(
        `Maksimum yang bisa dipinjam adalah ${maxQuantity}`,
      );
      setNotificationType("error");
      setShowNotification(true);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmBorrow = async () => {
    // Combine date and time into a single datetime string
    let dueDateTime = borrowForm.due_date;
    if (borrowForm.due_date && borrowForm.due_time) {
      dueDateTime = `${borrowForm.due_date}T${borrowForm.due_time}:00`; // Format: YYYY-MM-DDTHH:mm:ss
    }

    try {
      const response = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          book_id: selectedBook.id,
          due_date: dueDateTime,
          quantity: Number(borrowForm.quantity || 1),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store the transaction for later receipt viewing
        setBorrowedTransaction(result.transaction);

        // Decrement available copies locally based on requested quantity
        const qty = Number(borrowForm.quantity || 1);
        setBooks((prev) =>
          prev.map((b) =>
            b.id === selectedBook.id
              ? {
                  ...b,
                  available_copies: Math.max(
                    0,
                    (b.available_copies || 0) - qty,
                  ),
                }
              : b,
          ),
        );
        // Track pending reservation so we can revert if admin rejects
        if (result.transaction && result.transaction.id) {
          setPendingReservations((prev) => ({
            ...prev,
            [result.transaction.id]: qty,
          }));
        }
        // Show success notification
        setNotificationMessage(result.message); // Use the message from the response which should be "Permintaan peminjaman buku berhasil diajukan, menunggu persetujuan admin"
        setNotificationType("success");
        setShowNotification(true);

        // Close the borrow modal
        setShowBorrowModal(false);

        // Close confirmation modal
        setShowConfirmation(false);

        // Reset form
        setSelectedBook(null);
        setBorrowForm({ due_date: "", due_time: "07:00" }); // Reset to default time
        fetchBooks(); // Refresh the list
      } else {
        // Show error notification
        setNotificationMessage(
          result.message || "Gagal membuat permintaan peminjaman",
        );
        setNotificationType("error");
        setShowNotification(true);
      }
    } catch (error) {
      console.error("Error borrowing book:", error);
      // Show error notification
      setNotificationMessage("Terjadi kesalahan saat meminjam buku");
      setNotificationType("error");
      setShowNotification(true);
    }

    // Close confirmation modal regardless of outcome
    setShowConfirmation(false);
  };

  const cancelBorrow = () => {
    setShowConfirmation(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBorrowForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleViewReceipt = () => {
    if (borrowedTransaction) {
      setShowReceiptModal(true);
    }
  };

  const columns = [
    {
      key: "cover_image",
      header: "Cover",
      render: (value) =>
        value ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${value}`}
            alt="Cover"
            className="object-cover h-20 rounded w-14"
          />
        ) : (
          "-"
        ),
    },
    { key: "title", header: "Judul" },
    { key: "author", header: "Penulis" },
    {
      key: "publication_year",
      header: "Tahun Terbit",
      render: (value) => value || "-",
    },
    { key: "isbn", header: "ISBN", render: (value) => value || "-" },
    {
      key: "category_name",
      header: "Kategori",
      render: (value) => value || "-",
    },
    {
      key: "page_count",
      header: "Jumlah Halaman",
      render: (value) => value || "-",
    },
    { key: "available_copies", header: "Tersedia" },
  ];

  const actions = [
    {
      label: "Lihat",
      onClick: (book) => {
        setSelectedBook(book);
        setShowBookDetailsModal(true);
      },
      className: "text-blue-600 hover:text-blue-900",
      icon: EyeIcon,
    },
    {
      label: "Pinjam",
      onClick: (book) => handleBorrowBook(book),
      className: "text-green-600 hover:text-green-900",
      icon: BookOpenIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Pinjam Buku"
        headerActions={
          <div className="flex items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="relative max-w-md mb-4">
          <input
            type="text"
            placeholder="Cari buku..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:w-auto"
          />
          <div className="absolute text-gray-500 transform -translate-y-1/2 left-4 top-1/2">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              Tidak ada buku yang tersedia untuk dipinjam
            </p>
          </div>
        ) : (
          <Table columns={columns} data={books} actions={actions} />
        )}
      </Card>

      {/* Show View Receipt button if there's a recent transaction and it's not rejected or overdue */}
      {borrowedTransaction &&
        borrowedTransaction.status !== "rejected" &&
        borrowedTransaction.status !== "overdue" && (
          <div className="flex justify-center mt-4">
            <AnimatedButton
              onClick={handleViewReceipt}
              variant="primary"
              size="md"
            >
              Lihat Struk
            </AnimatedButton>
          </div>
        )}

      {/* Book Details Modal */}
      <Modal
        isOpen={showBookDetailsModal}
        onClose={() => setShowBookDetailsModal(false)}
        title="Detail Buku"
      >
        {selectedBook && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {selectedBook.cover_image ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${selectedBook.cover_image}`}
                  alt={selectedBook.title}
                  className="object-cover w-48 h-64 border rounded"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-48 h-64 border-2 border-gray-300 border-dashed rounded">
                  <span className="text-gray-500">Tidak ada cover</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Judul</p>
                <p className="text-gray-900">{selectedBook.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Penulis</p>
                <p className="text-gray-900">{selectedBook.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tahun Terbit
                </p>
                <p className="text-gray-900">
                  {selectedBook.publication_year || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ISBN</p>
                <p className="text-gray-900">{selectedBook.isbn || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Kategori</p>
                <p className="text-gray-900">
                  {selectedBook.category_name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tersedia</p>
                <p className="text-gray-900">{selectedBook.available_copies}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Jumlah Halaman
                </p>
                <p className="text-gray-900">
                  {selectedBook.page_count || "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Deskripsi</p>
              <p className="text-gray-900">{selectedBook.description || "-"}</p>
            </div>

            {/* E-book Information */}
            {(selectedBook.ebook_link || selectedBook.ebook_file) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="mb-2 text-sm font-medium text-gray-500">E-book</p>
                {selectedBook.ebook_link && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-900">Link E-book:</p>
                    <a
                      href={selectedBook.ebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 break-all hover:underline"
                    >
                      {selectedBook.ebook_link}
                    </a>
                  </div>
                )}
                {selectedBook.ebook_file && (
                  <div>
                    <p className="text-sm text-gray-900">File E-book:</p>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${selectedBook.ebook_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 break-all hover:underline"
                    >
                      {selectedBook.ebook_file.split("/").pop() ||
                        "Download E-book"}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm font-medium text-gray-500">
                Tanggal Ditambahkan
              </p>
              <p className="text-gray-900">
                {new Date(selectedBook.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex justify-end mt-6">
              <AnimatedButton
                onClick={() => setShowBookDetailsModal(false)}
                variant="danger"
                size="md"
              >
                Tutup
              </AnimatedButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        title={`Pinjam Buku: ${selectedBook?.title || ""}`}
      >
        {selectedBook && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmBorrow();
            }}
          >
            <div className="p-4 mb-4 rounded-lg bg-gray-50">
              <p className="mb-2 text-gray-700">
                <span className="font-medium">Judul:</span> {selectedBook.title}
              </p>
              <p className="mb-2 text-gray-700">
                <span className="font-medium">Penulis:</span>{" "}
                {selectedBook.author}
              </p>
              <p className="mb-2 text-gray-700">
                <span className="font-medium">Tahun Terbit:</span>{" "}
                {selectedBook.publication_year || "-"}
              </p>
              <p className="mb-2 text-gray-700">
                <span className="font-medium">Tersedia:</span>{" "}
                {selectedBook.available_copies} buku
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Jumlah Halaman:</span>{" "}
                {selectedBook.page_count} Halaman
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <InputField
                  label="Tanggal Jatuh Tempo"
                  id="due_date"
                  name="due_date"
                  type="date"
                  value={borrowForm.due_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="due_time"
                  className="block mb-1 text-sm font-medium text-foreground"
                >
                  Jam Jatuh Tempo
                </label>
                <input
                  type="time"
                  id="due_time"
                  name="due_time"
                  value={borrowForm.due_time || "07:00"}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block mb-1 text-sm font-medium text-foreground">
                Jumlah Buku
              </label>
              <input
                type="number"
                name="quantity"
                min={1}
                max={maxQuantity}
                value={borrowForm.quantity || 0}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maksimum: {maxQuantity} (tersedia:{" "}
                {selectedBook?.available_copies || 0}, batas per siswa:{" "}
                {MAX_PER_STUDENT})
              </p>
              {maxQuantity < 1 && (
                <p className="mt-1 text-sm text-red-600">
                  Anda tidak dapat meminjam lebih banyak buku—batas peminjaman
                  tercapai.
                </p>
              )}
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <AnimatedButton
                type="button"
                onClick={() => setShowBorrowModal(false)}
                variant="danger"
                size="md"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton type="submit" variant="primary" size="md">
                Konfirmasi Peminjaman
              </AnimatedButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Receipt Modal */}
      {showReceiptModal && borrowedTransaction && (
        <Receipt
          transaction={borrowedTransaction}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Notification */}
      <Notification
        message={notificationMessage}
        type={notificationType}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />

      {/* Confirmation Modal */}
      {showConfirmation && selectedBook && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin meminjam buku "${selectedBook.title}" oleh ${selectedBook.author}?`}
          confirmText={`Saya setuju untuk meminjam buku ini dan akan mengembalikannya sesuai tanggal jatuh tempo. Buku ini akan menunggu persetujuan admin.`}
          onConfirm={confirmBorrow}
          onCancel={cancelBorrow}
        />
      )}
    </div>
  );
};

export default BorrowBooksPage;
