// app/student/return/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import Notification from '../../../components/Notification';
import ConfirmationCheckbox from '../../../components/ConfirmationCheckbox';
import { ArrowUturnUpIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import AnimatedButton from '../../../components/AnimatedButton';

const ReturnBooksPage = () => {
  const { token, user } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionToReturn, setTransactionToReturn] = useState(null);

  useEffect(() => {
    fetchBorrowedBooks();
  }, [token, user]);

  const fetchBorrowedBooks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions?user_id=${user?.id}&status=borrowed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Transform the data to match what the table expects
      const transformedBooks = (data.transactions || []).map(transaction => ({
        id: transaction.id,
        book_id: transaction.book_id,
        title: transaction.book_title,
        author: transaction.book_author,
        due_date: transaction.due_date,
        borrowed_date: transaction.created_at
      }));
      
      setBorrowedBooks(transformedBooks);
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Show success notification
        setNotification({
          isVisible: true,
          message: `Berhasil mengembalikan buku "${transactionToReturn.title}"!`,
          type: 'success'
        });
        fetchBorrowedBooks(); // Refresh the list
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

  const columns = [
    { key: 'title', header: 'Judul Buku' },
    { key: 'author', header: 'Penulis' },
    { key: 'borrowed_date', header: 'Tanggal Pinjam', render: (value) => new Date(value).toLocaleDateString() },
    { key: 'due_date', header: 'Tanggal Jatuh Tempo', render: (value) => new Date(value).toLocaleDateString() },
  ];

  const actions = [
    {
      label: 'Kembalikan',
      onClick: (book) => handleReturnBook(book),
      className: 'text-red-600 hover:text-red-900',
      icon: ArrowUturnUpIcon
    }
  ];

  const closeNotification = () => {
    setNotification({ isVisible: false, message: '', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <Card title="Kembalikan Buku">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : borrowedBooks.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpenIcon className="mx-auto text-gray-400 h-15 w-15" />
            <p className="text-gray-500">Anda tidak memiliki buku yang sedang dipinjam</p>
          </div>  
        ) : (
          <Table columns={columns} data={borrowedBooks} actions={actions} />
        )}
      </Card>
      
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />

      {showConfirmation && transactionToReturn && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin mengembalikan buku "${transactionToReturn.title}"?`}
          confirmText="Saya setuju untuk mengembalikan buku ini sekarang."
          onConfirm={confirmReturnBook}
          onCancel={cancelReturnBook}
        />
      )}
    </div>
  );
};

export default ReturnBooksPage;