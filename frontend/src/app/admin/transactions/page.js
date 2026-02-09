// app/admin/transactions/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Card from "../../../components/Card";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import Receipt from "../../../components/Receipt";
import ConfirmationCheckbox from "../../../components/ConfirmationCheckbox";
import DynamicNotification from "../../../components/DynamicNotification";
import {
  EyeIcon,
  ArrowPathIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AnimatedButton from "../../../components/AnimatedButton";

const TransactionsPage = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showReturnConfirmation, setShowReturnConfirmation] = useState(false);
  const [transactionToReturn, setTransactionToReturn] = useState(null);
  const [showExtendConfirmation, setShowExtendConfirmation] = useState(false);
  const [transactionToExtend, setTransactionToExtend] = useState(null);
  const [extensionDuration, setExtensionDuration] = useState(7); // Default to 7 days
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  // State for add transaction form
  const [showAddForm, setShowAddForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("07:00"); // Default to 7:00 AM
  const [quantity, setQuantity] = useState(1);
  const [formLoading, setFormLoading] = useState(false);

  // State for receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransactionForReceipt, setSelectedTransactionForReceipt] =
    useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [token, searchTerm, filterStatus]);

  // Fetch users for the form
  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Only allow students to be selectable for borrowing
      const allUsers = data.users || [];
      const studentUsers = allUsers.filter((u) => u.role === "student");
      setUsers(studentUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch books for the form
  const fetchBooks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/books`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Only show books that are available
      const availableBooks = (data.books || []).filter(
        (book) => book.available_copies > 0,
      );
      setBooks(availableBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  // Handle opening the add transaction form
  const handleOpenAddForm = async () => {
    setFormLoading(true);
    await Promise.all([fetchUsers(), fetchBooks()]);
    setFormLoading(false);
    setShowAddForm(true);
  };

  // Handle form submission
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();

    if (!selectedUser || !selectedBook) {
      setNotification({
        isVisible: true,
        message: "Silakan pilih pengguna dan buku terlebih dahulu",
        type: "error",
      });
      return;
    }

    setFormLoading(true);

    // Combine date and time into a single datetime string
    let dueDateTime = dueDate;
    if (dueDate && dueTime) {
      dueDateTime = `${dueDate}T${dueTime}:00`; // Format: YYYY-MM-DDTHH:mm:ss
    }

    try {
      const response = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser,
          book_id: selectedBook,
          due_date: dueDateTime,
          quantity: Number(quantity) || 1,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowAddForm(false);
        setSelectedUser("");
        setSelectedBook("");
        setDueDate("");
        setDueTime("07:00"); // Reset to default time
        setQuantity(1);

        // Refresh the transactions list
        fetchTransactions();

        setNotification({
          isVisible: true,
          message: "Transaksi peminjaman buku berhasil ditambahkan!",
          type: "success",
        });
      } else {
        setNotification({
          isVisible: true,
          message: result.message || "Gagal menambahkan transaksi",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error creating transaction:", error);

      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menambahkan transaksi",
        type: "error",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      let url = `http://localhost:5000/api/transactions?search=${searchTerm}&sort_by=id&sort_order=ASC`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Ensure quantity exists and is numeric (default to 1)
      const txs = (data.transactions || []).map((t) => ({
        ...t,
        quantity: Number(t.quantity),
      }));
      setTransactions(txs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleReturnBook = async (transaction) => {
    setTransactionToReturn(transaction);
    setShowReturnConfirmation(true);
  };

  const confirmReturnBook = async () => {
    if (!transactionToReturn) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions/${transactionToReturn.id}/return`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchTransactions(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Buku "${transactionToReturn.book_title}" berhasil ditandai sebagai dikembalikan!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || "Gagal mengembalikan buku",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error returning book:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat mengembalikan buku",
        type: "error",
      });
    }

    // Close confirmation modal
    setShowReturnConfirmation(false);
    setTransactionToReturn(null);
  };

  const cancelReturnBook = () => {
    setShowReturnConfirmation(false);
    setTransactionToReturn(null);
  };

  const handleExtendDueDate = async (transaction) => {
    setTransactionToExtend(transaction);
    setShowExtendConfirmation(true);
  };

  const confirmExtendDueDate = async () => {
    if (!transactionToExtend) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions/${transactionToExtend.id}/extend`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ days: extensionDuration }),
        },
      );

      if (response.ok) {
        fetchTransactions(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Tanggal jatuh tempo buku "${transactionToExtend.book_title}" berhasil diperpanjang ${extensionDuration} hari!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message:
            errorData.message || "Gagal memperpanjang tanggal jatuh tempo",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error extending due date:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat memperpanjang tanggal jatuh tempo",
        type: "error",
      });
    }

    // Close confirmation modal
    setShowExtendConfirmation(false);
    setTransactionToExtend(null);
  };

  const cancelExtendDueDate = () => {
    setShowExtendConfirmation(false);
    setTransactionToExtend(null);
  };

  const handleDeleteTransaction = async (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions/${transactionToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchTransactions(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Transaksi peminjaman buku "${transactionToDelete.book_title}" berhasil dihapus!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || "Gagal menghapus transaksi",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menghapus transaksi",
        type: "error",
      });
    }

    // Close confirmation modal
    setShowDeleteConfirmation(false);
    setTransactionToDelete(null);
  };

  const cancelDeleteTransaction = () => {
    setShowDeleteConfirmation(false);
    setTransactionToDelete(null);
  };

  const handleApproveRequest = async (transaction) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions/${transaction.id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      if (response.ok) {
        // Update local state: prefer server-updated transaction, otherwise patch local entry
        const updated = data.transaction
          ? {
              ...data.transaction,
              quantity: Number(data.transaction.quantity),
            }
          : {
              ...transaction,
              status: "borrowed",
              quantity: Number(transaction.quantity),
            };
        setTransactions((prev) => {
          const exists = prev.some((t) => t.id === updated.id);
          if (exists)
            return prev.map((t) => (t.id === updated.id ? updated : t));
          return [updated, ...prev];
        });
        // Dispatch event so other components (dashboard) can react
        try {
          window.dispatchEvent(
            new CustomEvent("transactionAction", {
              detail: { action: "approve", transaction: updated },
            }),
          );
        } catch (e) {}

        setNotification({
          isVisible: true,
          message: `Permintaan peminjaman buku "${transaction.book_title}" berhasil disetujui!`,
          type: "success",
        });
      } else {
        // Show error notification
        setNotification({
          isVisible: true,
          message: data.message || "Gagal menyetujui permintaan peminjaman",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error approving request:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menyetujui permintaan peminjaman",
        type: "error",
      });
    }
  };

  const handleRejectRequest = async (transaction) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/transactions/${transaction.id}/reject`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();

      if (response.ok) {
        // Update local state: prefer server-updated transaction, otherwise mark locally as rejected
        const updated = data.transaction
          ? {
              ...data.transaction,
              quantity: Number(data.transaction.quantity),
            }
          : {
              ...transaction,
              status: "rejected",
              quantity: Number(transaction.quantity),
            };
        // If server returned updated transaction, replace; otherwise add/replace locally so it remains visible for deletion
        setTransactions((prev) => {
          const exists = prev.some((t) => t.id === updated.id);
          if (exists)
            return prev.map((t) => (t.id === updated.id ? updated : t));
          return [updated, ...prev];
        });
        // Dispatch event for dashboard
        try {
          window.dispatchEvent(
            new CustomEvent("transactionAction", {
              detail: { action: "reject", transaction: updated },
            }),
          );
        } catch (e) {}

        setNotification({
          isVisible: true,
          message: `Permintaan peminjaman buku "${transaction.book_title}" berhasil ditolak!`,
          type: "success",
        });
      } else {
        // Show error notification
        setNotification({
          isVisible: true,
          message: data.message || "Gagal menolak permintaan peminjaman",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error rejecting request:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menolak permintaan peminjaman",
        type: "error",
      });
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "user_name", header: "Pengguna" },
    { key: "book_title", header: "Buku" },
    {
      key: "quantity",
      header: "Jumlah",
      render: (value) => Number(value),
    },
    {
      key: "borrow_date",
      header: "Tanggal Pinjam",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "due_date",
      header: "Tanggal Jatuh Tempo",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "return_date",
      header: "Tanggal Kembali",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "fine_amount",
      header: "Denda",
      render: (value) =>
        value > 0 ? `Rp ${Number(value).toLocaleString("id-ID")}` : "Rp -",
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`inline-flex items-center justify-center min-w-[70px] px-2 py-1 rounded-full text-sm ${
            value === "borrowed"
              ? "bg-yellow-100 text-yellow-800"
              : value === "returned"
                ? "bg-green-100 text-green-800"
                : value === "pending"
                  ? "bg-blue-100 text-blue-800"
                  : value === "rejected"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-red-100 text-red-800"
          }`}
        >
          {value === "borrowed"
            ? "Dipinjam"
            : value === "returned"
              ? "Dikembalikan"
              : value === "pending"
                ? "Menunggu Persetujuan"
                : value === "rejected"
                  ? "Ditolak"
                  : "Terlambat"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "Lihat",
      onClick: handleViewDetails,
      className: "text-blue-600 hover:text-blue-900",
      icon: EyeIcon,
    },
    {
      label: "Setujui",
      onClick: handleApproveRequest,
      className: "text-green-600 hover:text-green-900",
      icon: ({ className }) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      condition: (transaction) => transaction.status === "pending", // Only show for pending requests
    },
    {
      label: "Tolak",
      onClick: handleRejectRequest,
      className: "text-red-600 hover:text-red-900",
      icon: ({ className }) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
      condition: (transaction) => transaction.status === "pending", // Only show for pending requests
    },
    {
      label: "Kembalikan",
      onClick: handleReturnBook,
      className: "text-green-600 hover:text-green-900",
      icon: ArrowPathIcon,
      condition: (transaction) => transaction.status === "borrowed", // Only show for borrowed books
    },
    {
      label: "Perpanjang",
      onClick: handleExtendDueDate,
      className: "text-purple-600 hover:text-purple-900",
      icon: ClockIcon,
      condition: (transaction) => transaction.status === "borrowed", // Only show for borrowed books
    },
    {
      label: "Hapus",
      onClick: handleDeleteTransaction,
      className: "text-red-600 hover:text-red-900",
      icon: ({ className }) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
      condition: (transaction) =>
        transaction.status === "returned" ||
        transaction.status === "rejected" ||
        transaction.status === "overdue", // Show for returned, rejected, or overdue books
    },
    {
      label: "Lihat Struk",
      onClick: (transaction) => {
        setSelectedTransactionForReceipt({ ...transaction }); // Create a new object to ensure re-render
        setShowReceiptModal(true);
      },
      className: "text-blue-600 hover:text-blue-900",
      icon: DocumentTextIcon,
      condition: (transaction) =>
        transaction.status !== "rejected" && transaction.status !== "overdue", // Hide for rejected and overdue transactions
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Kelola Transaksi"
        headerActions={
          <div className="flex flex-col items-center w-full space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 min-w-[80px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu Persetujuan</option>
                <option value="borrowed">Dipinjam</option>
                <option value="returned">Dikembalikan</option>
                <option value="rejected">Ditolak</option>
                <option value="overdue">Terlambat</option>
              </select>
            </div>
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="absolute text-gray-500 transform -translate-y-1/2 left-4 top-1/2">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
            </div>
            <AnimatedButton
              onClick={handleOpenAddForm}
              variant="primary"
              size="md"
              className="flex items-center min-w-[100px]"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2 cursor-pointer" />
              Tambah Transaksi
            </AnimatedButton>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={transactions} actions={actions} />
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Detail Transaksi #${selectedTransaction?.id}`}
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-black">Informasi Pengguna</h3>
                <p className="text-gray-900">
                  {" "}
                  Nama : {selectedTransaction.user_name}
                </p>
                <p className="text-gray-900">
                  Kelas : {selectedTransaction.user_class}
                </p>
                <p className="text-gray-900">
                  Alamat : {selectedTransaction.user_address}
                </p>
                <p className="text-gray-900">
                  NISN : {selectedTransaction.user_nisn}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black">Informasi Buku</h3>
                <p className="text-gray-900">
                  {selectedTransaction.book_title}
                </p>
                <p className="text-gray-900">
                  oleh {selectedTransaction.book_author}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-black">Tanggal Pinjam</h3>
                <p className="text-gray-900">
                  {new Date(
                    selectedTransaction.borrow_date,
                  ).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black">
                  Tanggal Jatuh Tempo
                </h3>
                <p className="text-gray-900">
                  {new Date(selectedTransaction.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-black">Tanggal Kembali</h3>
                <p className="text-gray-900">
                  {selectedTransaction.return_date
                    ? new Date(
                        selectedTransaction.return_date,
                      ).toLocaleDateString()
                    : "Belum dikembalikan"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-black">Status</h3>
                <p
                  className={`inline-flex items-center justify-center min-w-[70px] px-2 py-1 rounded-full text-sm ${
                    selectedTransaction.status === "borrowed"
                      ? "bg-yellow-200 text-yellow-800"
                      : selectedTransaction.status === "returned"
                        ? "bg-green-200 text-green-800"
                        : selectedTransaction.status === "pending"
                          ? "bg-blue-200 text-blue-800"
                          : selectedTransaction.status === "rejected"
                            ? "bg-gray-200 text-gray-800"
                            : "bg-red-200 text-red-800"
                  }`}
                >
                  {selectedTransaction.status === "borrowed"
                    ? "Dipinjam"
                    : selectedTransaction.status === "returned"
                      ? "Dikembalikan"
                      : selectedTransaction.status === "pending"
                        ? "Menunggu Persetujuan"
                        : selectedTransaction.status === "rejected"
                          ? "Ditolak"
                          : "Terlambat"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <AnimatedButton
            onClick={() => setShowModal(false)}
            variant="danger"
            size="md"
          >
            Tutup
          </AnimatedButton>
        </div>
      </Modal>

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirmation && transactionToDelete && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin menghapus transaksi peminjaman buku "${transactionToDelete.book_title}" oleh ${transactionToDelete.user_name}?`}
          confirmText="Saya setuju untuk menghapus transaksi ini secara permanen."
          onConfirm={confirmDeleteTransaction}
          onCancel={cancelDeleteTransaction}
        />
      )}

      {/* Confirmation Modal for Return */}
      {showReturnConfirmation && transactionToReturn && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin menandai buku "${transactionToReturn.book_title}" sebagai telah dikembalikan?`}
          confirmText="Saya setuju untuk menandai buku ini sebagai telah dikembalikan."
          onConfirm={confirmReturnBook}
          onCancel={cancelReturnBook}
        />
      )}

      {/* Confirmation Modal for Extend */}
      {showExtendConfirmation && transactionToExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md p-6 mx-4 bg-white rounded-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Perpanjang Tanggal Jatuh Tempo
            </h3>
            <p className="mb-4 text-gray-600">
              Apakah Anda yakin ingin memperpanjang tanggal jatuh tempo buku "
              <strong>{transactionToExtend.book_title}</strong>"?
            </p>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Durasi Perpanjangan:
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setExtensionDuration(1)}
                  className={`flex-1 px-4 py-2 text-sm rounded-md border ${
                    extensionDuration === 1
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  +1 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionDuration(3)}
                  className={`flex-1 px-4 py-2 text-sm rounded-md border ${
                    extensionDuration === 3
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  +3 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setExtensionDuration(7)}
                  className={`flex-1 px-4 py-2 text-sm rounded-md border ${
                    extensionDuration === 7
                      ? "bg-blue-600 text-white border-blue-700"
                      : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  +7 Hari
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelExtendDueDate}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmExtendDueDate}
                className="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
              >
                Perpanjang
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Transaction Form Modal */}
      {showAddForm && (
        <Modal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          title="Tambah Transaksi Peminjaman"
        >
          {formLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              <div>
                <label
                  htmlFor="user"
                  className="block mb-1 text-sm font-medium cursor-pointer text-foreground"
                >
                  Pengguna
                </label>
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-4 py-2 transition border rounded-lg border-input focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                >
                  {/* <option value="">Pilih Pengguna</option> */}
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="book"
                  className="block mb-1 text-sm font-medium text-foreground"
                >
                  Buku
                </label>
                <select
                  id="book"
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="w-full px-4 py-2 transition border rounded-lg border-input focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                >
                  {/* <option value="">Pilih Buku</option> */}
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} oleh {book.author} ({book.available_copies}{" "}
                      tersedia)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block mb-1 text-sm font-medium text-foreground"
                >
                  Jumlah
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2 transition border rounded-lg border-input focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="dueDate"
                    className="block mb-1 text-sm font-medium text-foreground"
                  >
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 transition border rounded-lg border-input focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dueTime"
                    className="block mb-1 text-sm font-medium text-foreground"
                  >
                    Jam Jatuh Tempo
                  </label>
                  <input
                    type="time"
                    id="dueTime"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-2 transition border rounded-lg border-input focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                  />
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Biarkan kosong untuk menggunakan tanggal jatuh tempo default
                (14 hari dari sekarang)
              </p>

              <div className="flex justify-end pt-4 space-x-3">
                <AnimatedButton
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  variant="danger"
                  size="md"
                >
                  Batal
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={formLoading}
                >
                  {formLoading ? "Menyimpan..." : "Simpan Transaksi"}
                </AnimatedButton>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransactionForReceipt && (
        <Receipt
          transaction={selectedTransactionForReceipt}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Dynamic Notification */}
      <DynamicNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() =>
          setNotification({ isVisible: false, message: "", type: "success" })
        }
      />
    </div>
  );
};

export default TransactionsPage;
