// app/student/my-books/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Card from "../../../components/Card";
import Table from "../../../components/Table";
import Receipt from "../../../components/Receipt";
import Notification from "../../../components/Notification";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

const MyBooksPage = () => {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState([]); // all transactions
  const [displayedTransactions, setDisplayedTransactions] = useState([]); // filtered by activeTab for table
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("borrowed"); // borrowed, returned, pending, or overdue
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const fetchTransactions = useCallback(async () => {
    try {
      // Fetch all transactions for the user so counts are available immediately
      const url = `http://localhost:5000/api/transactions?user_id=${user.id}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token && user) fetchTransactions();
  }, [token, user, fetchTransactions]);

  useEffect(() => {
    // Filter transactions for the current tab whenever data or tab changes
    if (!transactions) return setDisplayedTransactions([]);

    if (activeTab === "borrowed") {
      setDisplayedTransactions(
        transactions.filter(
          (t) => t.status === "borrowed" && new Date(t.due_date) >= new Date(), // Only borrowed books that are not overdue
        ),
      );
    } else if (activeTab === "overdue") {
      setDisplayedTransactions(
        transactions.filter(
          (t) =>
            t.status === "overdue" ||
            (t.status === "borrowed" && new Date(t.due_date) < new Date()), // Overdue books
        ),
      );
    } else {
      setDisplayedTransactions(
        transactions.filter((t) => t.status === activeTab),
      );
    }
  }, [transactions, activeTab]);

  // Listen for approve/reject events from admin actions and update student view
  useEffect(() => {
    const handler = (e) => {
      try {
        const { action, transaction } = e.detail || {};
        if (!transaction) return;

        // Determine transaction owner id if available
        const txUserId =
          transaction.user_id ?? transaction.userId ?? transaction.user?.id;
        if (txUserId != null) {
          if (String(txUserId) !== String(user?.id)) return;
        } else {
          // Fallback: try matching by name or email if id not present
          if (
            transaction.user_name &&
            user?.name &&
            transaction.user_name !== user.name
          )
            return;
          if (
            transaction.user_email &&
            user?.email &&
            transaction.user_email !== user.email
          )
            return;
        }

        // Update the transaction in the local state
        setTransactions((prev) => {
          const exists = prev.some((t) => t.id === transaction.id);
          if (exists) {
            return prev.map((t) => (t.id === transaction.id ? transaction : t));
          } else {
            return [transaction, ...prev];
          }
        });

        // Show notification to user
        const message =
          action === "approve"
            ? `Permintaan peminjaman buku "${transaction.book_title || "Buku"}" telah disetujui.`
            : `Permintaan peminjaman buku "${transaction.book_title || "Buku"}" telah ditolak.`;

        setNotification({
          isVisible: true,
          message: message,
          type: action === "approve" ? "success" : "error",
        });
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("transactionAction", handler);
    return () => window.removeEventListener("transactionAction", handler);
  }, [user]);

  // return handled by admin only; student UI does not provide return actions

  const columns = [
    { key: "book_title", header: "Judul Buku" },
    { key: "book_author", header: "Penulis" },
    {
      key: "book_publication_year",
      header: "Tahun Terbit",
      render: (value) => value || "-",
    },
    {
      key: "borrow_date",
      header: "Tanggal Pinjam",
      render: (value) =>
        new Date(value).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
    {
      key: "due_date",
      header: "Tanggal Jatuh Tempo",
      render: (value) =>
        new Date(value).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
    {
      key: "fine_amount",
      header: "Denda",
      render: (value) =>
        value > 0 ? `Rp ${Number(value).toLocaleString("id-ID")}` : "Rp -",
    },
    // { key: 'return_date', header: 'Tanggal Kembali', render: (value) => value ? new Date(value).toLocaleDateString() : '-' },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
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

  const closeNotification = () => {
    setNotification({ isVisible: false, message: "", type: "success" });
  };

  return (
    <div className="space-y-6">
      <Card title="Buku Saya">
        <div className="flex mb-4 border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium text-sm cursor-pointer ${
              activeTab === "borrowed"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("borrowed")}
          >
            Dipinjam (
            {
              transactions.filter(
                (t) =>
                  t.status === "borrowed" && new Date(t.due_date) >= new Date(),
              ).length
            }
            )
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm cursor-pointer ${
              activeTab === "overdue"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("overdue")}
          >
            Terlambat (
            {
              transactions.filter(
                (t) =>
                  t.status === "overdue" ||
                  (t.status === "borrowed" &&
                    new Date(t.due_date) < new Date()),
              ).length
            }
            )
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm cursor-pointer ${
              activeTab === "pending"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Menunggu (
            {transactions.filter((t) => t.status === "pending").length})
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm cursor-pointer ${
              activeTab === "returned"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("returned")}
          >
            Dikembalikan (
            {transactions.filter((t) => t.status === "returned").length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : (
          <Table columns={columns} data={displayedTransactions} />
        )}
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <Receipt
          transaction={selectedTransaction}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />

      {/* Student return confirmation removed — returns handled by admin only */}
    </div>
  );
};

export default MyBooksPage;
