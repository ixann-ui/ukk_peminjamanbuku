// app/student/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { BookmarkSquareIcon, BookOpenIcon, ArrowUturnUpIcon, ExclamationTriangleIcon, BanknotesIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DynamicNotification from '../../../components/DynamicNotification';

const StudentDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({
    borrowedBooks: 0,
    returnedBooks: 0,
    overdueBooks: 0,
    totalBooks: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // Define fetchStats function outside useEffect so it can be called from other functions
  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch user's transactions
      const transactionsRes = await fetch(`http://localhost:5000/api/transactions?user_id=${user?.id}&limit=5&sort_by=id&sort_order=ASC`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const transactionsData = await transactionsRes.json();

      if (transactionsData.transactions) {
        const borrowed = transactionsData.transactions.filter(t => t.status === 'borrowed').length;
        const returned = transactionsData.transactions.filter(t => t.status === 'returned').length;

        // For overdue, we'd need to check dates
        const overdue = transactionsData.transactions.filter(t => {
          const dueDate = new Date(t.due_date);
          const currentDate = new Date();
          return t.status === 'borrowed' && dueDate < currentDate;
        }).length;

        setStats({
          borrowedBooks: borrowed,
          returnedBooks: returned,
          overdueBooks: overdue,
          totalBooks: transactionsData.transactions.length
        });

        // Format recent activities
        const activities = transactionsData.transactions.slice(0, 5).map(transaction => {
          let activityText = '';
          let icon = BookmarkSquareIcon;
          let color = 'blue';

          if (transaction.status === 'borrowed') {
            activityText = `Meminjam buku: ${transaction.book_title}`;
            icon = BookmarkSquareIcon;
            color = 'blue';
          } else if (transaction.status === 'returned') {
            activityText = `Mengembalikan buku: ${transaction.book_title}`;
            icon = ArrowUturnUpIcon;
            color = 'green';
          }

          return {
            id: transaction.id,
            text: activityText,
            icon: icon,
            color: color,
            date: transaction.created_at || transaction.return_date,
            status: transaction.status
          };
        });

        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchStats();
    }
  }, [token, user]);

  const handleClearActivities = async () => {
    if (!token) return;

    setIsClearing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/transactions/activities/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setNotification({ show: true, message: data.message, type: 'success' });
        // Refresh the activities after clearing
        fetchStats();
      } else {
        setNotification({
          show: true,
          message: 'Gagal membersihkan aktivitas: ' + (data.message || 'Terjadi kesalahan'),
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error clearing activities:', error);
      setNotification({
        show: true,
        message: 'Terjadi kesalahan saat membersihkan aktivitas',
        type: 'error'
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
    { title: 'Buku Dipinjam', value: stats.borrowedBooks, icon: BookmarkSquareIcon, color: 'bg-blue-500' },
    { title: 'Buku Dikembalikan', value: stats.returnedBooks, icon: ArrowUturnUpIcon, color: 'bg-green-500' },
    { title: 'Buku Terlambat', value: stats.overdueBooks, icon: ExclamationTriangleIcon, color: 'bg-red-500' },
    { title: 'Total Transaksi', value: stats.totalBooks, icon: BanknotesIcon, color: 'bg-purple-500' },
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
          <h1 className="text-2xl font-bold text-gray-800">Selamat Datang, {user?.name}!</h1>
          <p className="text-gray-600">Kelola aktivitas peminjaman buku Anda</p>
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
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {statCards.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <motion.div
                    key={index}
                    className="flex items-center w-full min-w-0 p-6 bg-white shadow rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl mr-4 flex-shrink-0`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500 truncate">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-800 truncate">{stat.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Quick Actions - Responsive Grid */}
            <motion.div
              className="w-full max-w-full p-6 bg-white shadow rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.h2
                className="mb-4 text-lg font-semibold text-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                Tindakan Cepat
              </motion.h2>
              <div
                className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
              >
                <motion.a
                  href="/student/browse"
                  className="p-4 text-center transition border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 min-h-[120px] flex flex-col justify-center overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-center mb-2 text-2xl">
                    <MagnifyingGlassIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-blue-700 truncate">Jelajahi Buku</h3>
                </motion.a>
                <motion.a
                  href="/student/borrow"
                  className="p-4 text-center transition border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 min-h-[120px] flex flex-col justify-center overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-center mb-2 text-2xl">
                    <BookmarkSquareIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-green-700 truncate">Pinjam Buku</h3>
                </motion.a>
                <motion.a
                  href="/student/my-books"
                  className="p-4 text-center transition border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 min-h-[120px] flex flex-col justify-center overflow-hidden"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-center mb-2 text-2xl">
                    <BookOpenIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium text-purple-700 truncate">Buku Saya</h3>
                </motion.a>
              </div>
            </motion.div>

            {/* Recent Activity - Responsive */}
            <motion.div
              className="w-full p-6 overflow-x-hidden bg-white shadow rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.h2
                  className="text-lg font-semibold text-gray-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  Aktivitas Terbaru
                </motion.h2>
                {recentActivities.length > 0 && (
                  <motion.button
                    onClick={triggerClearActivities}
                    disabled={isClearing}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                      isClearing
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                  >
                    {isClearing ? (
                      <>
                        <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menghapus...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-4 h-4" />
                        Bersihkan Aktivitas
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              <div className="w-full space-y-4 overflow-x-hidden">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const IconComponent = activity.icon;
                    const bgColor = activity.color === 'blue' ? 'bg-blue-100' : 'bg-green-100';
                    const textColor = activity.color === 'blue' ? 'text-blue-600' : 'text-green-600';

                    return (
                      <motion.div
                        key={activity.id}
                        className="flex items-center w-full max-w-full p-3 border border-gray-200 rounded-lg"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColor} ${textColor} mr-3 flex-shrink-0`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="font-medium truncate">{activity.text}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {new Date(activity.date).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    className="w-full py-8 text-center text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.3 }}
                  >
                    Belum ada aktivitas terbaru
                  </motion.div>
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
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Yakin ingin membersihkan aktivitas?</h3>
            <p className="mb-6 text-gray-600">
              Yakin ingin membersihkan aktivitas lama (aktivitas yang telah selesai)? Data yang telah dihapus tidak dapat dipulihkan.
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

export default StudentDashboard;