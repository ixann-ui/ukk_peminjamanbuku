// app/admin/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  UserGroupIcon,
  BookOpenIcon,
  TagIcon,
  ArrowPathIcon,
  TrashIcon,
  BanknotesIcon,
  RectangleStackIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import DynamicNotification from "../../../components/DynamicNotification";

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalCategories: 0,
    activeBorrows: 0,
    pendingRequests: 0,
    overdueBooks: 0,
    totalFines: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Define fetchStats function outside useEffect so it can be called from other functions
  const fetchStats = async () => {
    try {
      setLoading(true);
      const [
        usersRes,
        booksRes,
        categoriesRes,
        allTransactionsRes, // Get all transactions to calculate fines properly
        pendingTransactionsRes,
        recentTransactionsRes,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/books", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/transactions", {
          // Get all transactions
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/transactions?status=pending", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          "http://localhost:5000/api/transactions?limit=5&sort_by=id&sort_order=DESC",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ]);

      const [
        usersData,
        booksData,
        categoriesData,
        allTransactionsData,
        pendingTransactionsData,
        recentTransactionsData,
      ] = await Promise.all([
        usersRes.json(),
        booksRes.json(),
        categoriesRes.json(),
        allTransactionsRes.json(),
        pendingTransactionsRes.json(),
        recentTransactionsRes.json(),
      ]);

      // Count pending requests separately
      const pendingCount = pendingTransactionsData.transactions?.length || 0;

      // Count active borrows (borrowed and overdue)
      const activeBorrows =
        allTransactionsData.transactions?.filter(
          (t) => t.status === "borrowed" || t.status === "overdue",
        ).length || 0;

      // Count overdue books separately
      const overdueBooks =
        allTransactionsData.transactions?.filter((t) => t.status === "overdue")
          .length || 0;

      // Calculate total fines from all transactions
      const totalFines =
        allTransactionsData.transactions?.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.fine_amount) || 0);
        }, 0) || 0;

      setStats({
        totalUsers: usersData.pagination?.totalUsers || 0,
        totalBooks: booksData.pagination?.totalBooks || 0,
        totalCategories: categoriesData.pagination?.totalCategories || 0,
        activeBorrows: activeBorrows,
        pendingRequests: pendingCount,
        overdueBooks: overdueBooks,
        totalFines: totalFines,
      });

      // Format recent activities
      const activities = (recentTransactionsData.transactions || [])
        .slice(0, 5)
        .map((transaction) => {
          let activityText = "";
          let icon = BookOpenIcon;
          let color = "blue";

          if (transaction.status === "borrowed") {
            const reportedQty =
              Number(
                transaction.quantity ??
                  transaction.count ??
                  transaction.book_count ??
                  (transaction.books ? transaction.books.length : 1),
              ) || 1;
            const displayQty = Math.min(reportedQty, 5); // enforce max display of 5 per siswa
            let qtyText = reportedQty > 1 ? ` sebanyak ${displayQty} buku` : "";
            if (reportedQty > displayQty)
              qtyText += ` (dilaporkan ${reportedQty})`;
            activityText =
              `Siswa bernama ${transaction.user_name} meminjam buku: ${transaction.book_title || "Buku"}` +
              qtyText;
            icon = BookOpenIcon;
            color = "blue";
          } else if (transaction.status === "returned") {
            activityText = `Siswa bernama ${transaction.user_name} mengembalikan buku: ${transaction.book_title || "Buku"}`;
            icon = ArrowPathIcon;
            color = "green";
          } else if (transaction.status === "pending") {
            activityText = `${transaction.user_name} mengajukan permintaan peminjaman buku: ${transaction.book_title || "Buku"}`;
            icon = BookOpenIcon;
            color = "blue";
          } else if (transaction.status === "overdue") {
            const fineAmount =
              transaction.fine_amount > 0
                ? `Rp ${Number(transaction.fine_amount).toLocaleString("id-ID")}`
                : "Rp 0";
            activityText = ` Siswa bernama ${transaction.user_name} terlambat mengembalikan buku: ${transaction.book_title || "Buku"} (Denda: ${fineAmount})`;
            icon = ExclamationTriangleIcon;
            color = "red";
          } else if (transaction.status === "rejected") {
            activityText = `${transaction.user_name} permintaan peminjaman ditolak: ${transaction.book_title || "Buku"}`;
            icon = TrashIcon;
            color = "red";
          }

          return {
            id: transaction.id,
            text: activityText,
            icon: icon,
            color: color,
            date: transaction.created_at || transaction.return_date,
            status: transaction.status,
          };
        });

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  // Listen for transaction actions (approve/reject/return) from other admin pages
  useEffect(() => {
    const handler = (e) => {
      try {
        const { action, transaction } = e.detail || {};
        if (!transaction || !action) return;

        let activityText = "";
        let icon = BookOpenIcon;
        let color = "blue";

        if (action === "approve") {
          const reportedQty =
            Number(
              transaction.quantity ??
                transaction.count ??
                transaction.book_count ??
                (transaction.books ? transaction.books.length : 1),
            ) || 1;
          const displayQty = Math.min(reportedQty, 5);
          let qtyText = reportedQty > 1 ? ` sebanyak ${displayQty} buku` : "";
          if (reportedQty > displayQty)
            qtyText += ` (dilaporkan ${reportedQty})`;
          activityText =
            `${transaction.user_name} permintaan disetujui: ${transaction.book_title || "Buku"}` +
            qtyText;
          icon = ArrowPathIcon;
          color = "green";
        } else if (action === "reject") {
          const reportedQty =
            Number(
              transaction.quantity ??
                transaction.count ??
                transaction.book_count ??
                (transaction.books ? transaction.books.length : 1),
            ) || 1;
          const displayQty = Math.min(reportedQty, 5);
          let qtyText = reportedQty > 1 ? ` sebanyak ${displayQty} buku` : "";
          if (reportedQty > displayQty)
            qtyText += ` (dilaporkan ${reportedQty})`;
          activityText =
            `${transaction.user_name} permintaan ditolak: ${transaction.book_title || "Buku"}` +
            qtyText;
          icon = TrashIcon;
          color = "red";
        } else if (action === "return") {
          const fineAmount =
            transaction.fine_amount > 0
              ? `Rp ${Number(transaction.fine_amount).toLocaleString("id-ID")}`
              : "Rp 0";
          const reportedQty =
            Number(
              transaction.quantity ??
                transaction.count ??
                transaction.book_count ??
                (transaction.books ? transaction.books.length : 1),
            ) || 1;
          const displayQty = Math.min(reportedQty, 5);
          let qtyText = reportedQty > 1 ? ` sebanyak ${displayQty} buku` : "";
          if (reportedQty > displayQty)
            qtyText += ` (dilaporkan ${reportedQty})`;
          activityText =
            `Siswa  ${transaction.user_name} mengembalikan buku: ${transaction.book_title || "Buku"}` +
            qtyText +
            ` (Denda: ${fineAmount})`;
          icon = ArrowPathIcon;
          color = "green";
        } else if (action === "overdue") {
          const fineAmount =
            transaction.fine_amount > 0
              ? `Rp ${Number(transaction.fine_amount).toLocaleString("id-ID")}`
              : "Rp 0";
          const reportedQty =
            Number(
              transaction.quantity ??
                transaction.count ??
                transaction.book_count ??
                (transaction.books ? transaction.books.length : 1),
            ) || 1;
          const displayQty = Math.min(reportedQty, 5);
          let qtyText = reportedQty > 1 ? ` sebanyak ${displayQty} buku` : "";
          if (reportedQty > displayQty)
            qtyText += ` (dilaporkan ${reportedQty})`;
          activityText =
            `${transaction.user_name} terlambat mengembalikan buku: ${transaction.book_title || "Buku"}` +
            qtyText +
            ` (Denda: ${fineAmount})`;
          icon = ExclamationTriangleIcon;
          color = "red";
        }

        const newActivity = {
          id: `local-${Date.now()}`,
          text: activityText,
          icon,
          color,
          date: new Date().toISOString(),
          status: transaction.status,
        };

        setRecentActivities((prev) => {
          const updated = [newActivity, ...(prev || [])];
          return updated.slice(0, 5);
        });

        // Optionally update stats counters quickly
        setStats((s) => ({
          ...s,
          pendingRequests:
            action === "approve" || action === "reject"
              ? Math.max(0, (s.pendingRequests || 0) - 1)
              : s.pendingRequests,
          activeBorrows:
            action === "approve" ? (s.activeBorrows || 0) + 1 : s.activeBorrows,
        }));
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("transactionAction", handler);
    return () => window.removeEventListener("transactionAction", handler);
  }, [token]);

  const handleClearActivities = async () => {
    if (!token) return;

    setIsClearing(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/transactions/activities/clear`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setNotification({ show: true, message: data.message, type: "success" });
        // Refresh the activities after clearing
        fetchStats();
      } else {
        setNotification({
          show: true,
          message:
            "Gagal membersihkan aktivitas: " +
            (data.message || "Terjadi kesalahan"),
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error clearing activities:", error);
      setNotification({
        show: true,
        message: "Terjadi kesalahan saat membersihkan aktivitas",
        type: "error",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const triggerClearActivities = () => {
    setShowConfirmation(true);
  };

  const confirmClearActivities = () => {
    setShowConfirmation(false);
    handleClearActivities();
  };

  const cancelClearActivities = () => {
    setShowConfirmation(false);
  };

  const statCards = [
    {
      title: "Total Pengguna",
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: "bg-blue-500",
    },
    {
      title: "Total Buku",
      value: stats.totalBooks,
      icon: BookOpenIcon,
      color: "bg-green-500",
    },
    {
      title: "Kategori",
      value: stats.totalCategories,
      icon: TagIcon,
      color: "bg-yellow-500",
    },
    // {
    //   title: "Peminjaman Aktif",
    //   value: stats.activeBorrows,
    //   icon: CheckBadgeIcon,
    //   color: "bg-purple-500",
    // },
    {
      title: "Buku Terlambat",
      value: stats.overdueBooks,
      icon: ExclamationTriangleIcon,
      color: "bg-red-500",
    },
    {
      title: "Permintaan Persetujuan",
      value: stats.pendingRequests,
      icon: RectangleStackIcon,
      color: "bg-indigo-500",
    },
    {
      title: "Total Denda",
      value:
        stats.totalFines > 0
          ? `Rp ${stats.totalFines.toLocaleString("id-ID")}`
          : "Rp 0",
      icon: BanknotesIcon,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="w-full overflow-x-hidden">
      <motion.div
        className="box-border w-full max-w-full p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gray-800">
            Selamat Datang, {user?.name || "Admin"}!
          </h1>
          <p className="text-gray-600">Sistem Manajemen Peminjaman Buku</p>
        </motion.div>

        {loading ? (
          <motion.div
            className="flex items-center justify-center w-full h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </motion.div>
        ) : (
          <>
            {/* Stats Cards - Responsive Grid */}
            <motion.div
              className="grid w-full max-w-full gap-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {statCards.map((stat, index) => {
                const IconComponent = stat.icon;
                let linkTo = "";

                switch (stat.title) {
                  case "Total Pengguna":
                    linkTo = "/admin/users";
                    break;
                  case "Total Buku":
                    linkTo = "/admin/books";
                    break;
                  case "Kategori":
                    linkTo = "/admin/categories";
                    break;
                  // case "Peminjaman Aktif":
                  //   linkTo = "/admin/transactions";
                  //   break;
                  case "Permintaan Persetujuan":
                    linkTo = "/admin/transactions?status=pending";
                    break;
                  case "Buku Terlambat":
                    linkTo = "/admin/transactions?status=overdue";
                    break;
                  case "Total Denda":
                    linkTo = "/admin/transactions?status=overdue";
                    break;
                  default:
                    linkTo = "#";
                }

                return (
                  <motion.div
                    key={index}
                    className="flex items-center w-full min-w-0 p-6 transition-shadow bg-white shadow cursor-pointer rounded-xl hover:shadow-lg" // Added cursor-pointer and hover effects
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    onClick={() => (window.location.href = linkTo)} // Added click handler
                  >
                    <div
                      className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl mr-4 flex-shrink-0`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500 truncate">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-800 truncate">
                        {stat.value}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Recent Activity - Responsive */}
            <motion.div
              className="w-full p-6 overflow-x-hidden bg-white shadow rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.h2
                  className="text-lg font-semibold text-gray-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  Aktivitas Terbaru
                </motion.h2>
                {recentActivities.length > 0 && (
                  <motion.button
                    onClick={triggerClearActivities}
                    disabled={isClearing}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                      isClearing
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                  >
                    {isClearing ? (
                      <>
                        <svg
                          className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Menghapus...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-4 h-4 cursor-pointer" />
                        Bersihkan Aktivitas
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              {/* Desktop Table View */}
              <div className="hidden w-full overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Aktivitas
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                      >
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => {
                        const IconComponent = activity.icon;
                        const bgColor =
                          activity.color === "blue"
                            ? "bg-blue-100"
                            : activity.color === "red"
                              ? "bg-red-100"
                              : "bg-green-100";
                        const textColor =
                          activity.color === "blue"
                            ? "text-blue-600"
                            : activity.color === "red"
                              ? "text-red-600"
                              : "text-green-600";

                        return (
                          <motion.tr
                            key={activity.id}
                            className="hover:bg-gray-50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className={`flex items-center justify-center w-8 h-8 mr-3 ${textColor} ${bgColor} rounded-full flex-shrink-0`}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {activity.text}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {new Date(activity.date).toLocaleDateString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          className="px-6 py-12 text-sm text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <svg
                              className="w-12 h-12 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            <p className="mt-4 font-medium">
                              Tidak ada aktivitas
                            </p>
                            <p className="text-gray-500">
                              Aktivitas akan muncul di sini ketika tersedia
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const IconComponent = activity.icon;
                    const bgColor =
                      activity.color === "blue"
                        ? "bg-blue-100"
                        : activity.color === "red"
                          ? "bg-red-100"
                          : "bg-green-100";
                    const textColor =
                      activity.color === "blue"
                        ? "text-blue-600"
                        : activity.color === "red"
                          ? "text-red-600"
                          : "text-green-600";

                    return (
                      <motion.div
                        key={activity.id}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-start">
                          <div
                            className={`flex items-center justify-center w-10 h-10 mr-3 ${textColor} ${bgColor} rounded-full flex-shrink-0`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              {activity.text}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString(
                                "id-ID",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <svg
                      className="w-12 h-12 mx-auto text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <p className="mt-4 font-medium text-gray-900">
                      Tidak ada aktivitas
                    </p>
                    <p className="text-gray-500">
                      Aktivitas akan muncul di sini ketika tersedia
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md p-6 mx-4 bg-white rounded-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Yakin ingin membersihkan aktivitas?
            </h3>
            <p className="mb-6 text-gray-600">
              Yakin ingin membersihkan aktivitas lama (aktivitas yang telah
              selesai)? Data yang telah dihapus tidak dapat dipulihkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelClearActivities}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmClearActivities}
                className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Component */}
      <DynamicNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
};

export default AdminDashboard;
