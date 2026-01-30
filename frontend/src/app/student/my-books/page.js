// app/student/my-books/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import Receipt from '../../../components/Receipt';
import Notification from '../../../components/Notification';
import ConfirmationCheckbox from '../../../components/ConfirmationCheckbox';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import AnimatedButton from '../../../components/AnimatedButton';

const MyBooksPage = () => {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('borrowed'); // borrowed or returned
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionToReturn, setTransactionToReturn] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [token, activeTab]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions?user_id=${user.id}&status=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (transaction) => {
    setTransactionToReturn(transaction);
    setShowConfirmation(true);
  };

  const confirmReturnBook = async () => {
    if (!transactionToReturn) return;

    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${transactionToReturn.id}/return`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (response.ok) {
        // Show success notification
        setNotification({
          isVisible: true,
          message: `Buku "${transactionToReturn.book_title}" berhasil dikembalikan!`,
          type: 'success'
        });
        fetchTransactions(); // Refresh the list
      } else {
        // Show error notification
        setNotification({
          isVisible: true,
          message: result.message || 'Gagal mengembalikan buku',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error returning book:', error);
      // Show error notification
      setNotification({
        isVisible: true,
        message: 'Terjadi kesalahan saat mengembalikan buku',
        type: 'error'
      });
    }

    // Close confirmation modal
    setShowConfirmation(false);
    setTransactionToReturn(null);
  };

  const cancelReturnBook = () => {
    setShowConfirmation(false);
    setTransactionToReturn(null);
  };

  const handleViewReceipt = (transaction) => {
    setSelectedTransaction({...transaction}); // Create a new object to ensure re-render
    setShowReceiptModal(true);
  };

  const columns = [
    { key: 'book_title', header: 'Judul Buku' },
    { key: 'book_author', header: 'Penulis' },
    { key: 'book_publication_year', header: 'Tahun Terbit', render: (value) => value || '-' },
    { key: 'borrow_date', header: 'Tanggal Pinjam', render: (value) => new Date(value).toLocaleDateString() },
    { key: 'due_date', header: 'Tanggal Jatuh Tempo', render: (value) => new Date(value).toLocaleDateString() },
 // { key: 'return_date', header: 'Tanggal Kembali', render: (value) => value ? new Date(value).toLocaleDateString() : '-' },
    { key: 'status', header: 'Status', render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs ${
        value === 'borrowed' ? 'bg-yellow-100 text-yellow-800' :
        value === 'returned' ? 'bg-green-100 text-green-800' :
        'bg-red-100 text-red-800'
      }`}>
        {value === 'borrowed' ? 'Dipinjam' : value === 'returned' ? 'Dikembalikan' : 'Terlambat'}
      </span>
    )}
  ];

  const actions = [
    {
      label: 'Lihat Struk',
      onClick: (transaction) => handleViewReceipt(transaction),
      className: 'text-blue-600 hover:text-blue-900',
      icon: DocumentTextIcon
    },
    ...(activeTab === 'borrowed' ? [{
      label: 'Kembalikan',
      onClick: (transaction) => handleReturnBook(transaction),
      className: 'text-red-600 hover:text-red-900',
      icon: ArrowPathIcon
    }] : [])
  ];

  const closeNotification = () => {
    setNotification({ isVisible: false, message: '', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <Card title="Buku Saya">
        <div className="flex mb-4 border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'borrowed'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('borrowed')}
          >
            Dipinjam ({transactions.filter(t => t.status === 'borrowed').length})
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'returned'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('returned')}
          >
            Dikembalikan ({transactions.filter(t => t.status === 'returned').length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : (
          <Table columns={columns} data={transactions} actions={actions} />
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

      {showConfirmation && transactionToReturn && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin mengembalikan buku "${transactionToReturn.book_title}"?`}
          confirmText="Saya setuju untuk mengembalikan buku ini sekarang."
          onConfirm={confirmReturnBook}
          onCancel={cancelReturnBook}
        />
      )}
    </div>
  );
};

export default MyBooksPage;