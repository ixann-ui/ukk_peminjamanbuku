// app/student/borrow/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import Modal from '../../../components/Modal';
import InputField from '../../../components/InputField';
import Receipt from '../../../components/Receipt';
import Notification from '../../../components/Notification';
import ConfirmationCheckbox from '../../../components/ConfirmationCheckbox';
import { MagnifyingGlassIcon, BookOpenIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import AnimatedButton from '../../../components/AnimatedButton';

const BorrowBooksPage = () => {
  const { token, user } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowForm, setBorrowForm] = useState({
    due_date: ''
  });
  const [borrowedTransaction, setBorrowedTransaction] = useState(null);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [token, searchTerm, selectedCategory]);

  const fetchBooks = async () => {
    try {
      let url = `http://localhost:5000/api/books?search=${searchTerm}`;
      if (selectedCategory) {
        url += `&category_id=${selectedCategory}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // Filter books to only show those with available copies
      const availableBooks = (data.books || []).filter(book => book.available_copies > 0);
      setBooks(availableBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleBorrowBook = (book) => {
    setSelectedBook(book);
    // Set default due date to 14 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);
    const formattedDate = defaultDueDate.toISOString().split('T')[0];
    setBorrowForm({ due_date: formattedDate });
    setShowBorrowModal(true);
  };

  const handleConfirmBorrow = () => {
    if (!borrowForm.due_date) {
      // Show error notification
      setNotificationMessage('Silakan pilih tanggal jatuh tempo');
      setNotificationType('error');
      setShowNotification(true);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmBorrow = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          book_id: selectedBook.id,
          due_date: borrowForm.due_date
        })
      });

      const result = await response.json();

      if (response.ok) {
        // Store the transaction for later receipt viewing
        setBorrowedTransaction(result.transaction);

        // Show success notification
        setNotificationMessage(`Berhasil meminjam buku "${selectedBook.title}"!`);
        setNotificationType('success');
        setShowNotification(true);

        // Close the borrow modal
        setShowBorrowModal(false);

        // Close confirmation modal
        setShowConfirmation(false);

        // Reset form
        setSelectedBook(null);
        setBorrowForm({ due_date: '' });
        fetchBooks(); // Refresh the list
      } else {
        // Show error notification
        setNotificationMessage(result.message || 'Gagal meminjam buku');
        setNotificationType('error');
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      // Show error notification
      setNotificationMessage('Terjadi kesalahan saat meminjam buku');
      setNotificationType('error');
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
    setBorrowForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewReceipt = () => {
    if (borrowedTransaction) {
      setShowReceiptModal(true);
    }
  };

  const columns = [
    { key: 'title', header: 'Judul' },
    { key: 'author', header: 'Penulis' },
    { key: 'publication_year', header: 'Tahun Terbit', render: (value) => value || '-' },
    { key: 'isbn', header: 'ISBN', render: (value) => value || '-' },
    { key: 'category_name', header: 'Kategori', render: (value) => value || '-' },
    { key: 'available_copies', header: 'Tersedia' },
  ];

  const actions = [
    {
      label: 'Pinjam',
      onClick: (book) => handleBorrowBook(book),
      className: 'text-green-600 hover:text-green-900',
      icon: BookOpenIcon
    }
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Pinjam Buku"
        headerActions={
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari buku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:w-auto bg-white shadow-sm"
              />
              <div className="absolute text-gray-500 transform -translate-y-1/2 left-4 top-1/2">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada buku yang tersedia untuk dipinjam</p>
          </div>
        ) : (
          <Table columns={columns} data={books} actions={actions} />
        )}
      </Card>

      {/* Show View Receipt button if there's a recent transaction */}
      {borrowedTransaction && (
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

      <Modal
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        title={`Pinjam Buku: ${selectedBook?.title || ''}`}
      >
        {selectedBook && (
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmBorrow(); }}>
            <div className="mb-4">
              <p className="text-gray-700 mb-2"><span className="font-medium">Judul:</span> {selectedBook.title}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Penulis:</span> {selectedBook.author}</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Tahun Terbit:</span> {selectedBook.publication_year || '-'}</p>
              <p className="text-gray-700"><span className="font-medium">Tersedia:</span> {selectedBook.available_copies} buku</p>
            </div>

            <InputField
              label="Tanggal Jatuh Tempo"
              id="due_date"
              name="due_date"
              type="date"
              value={borrowForm.due_date}
              onChange={handleInputChange}
              required
            />

            <div className="mt-6 flex justify-end space-x-3">
              <AnimatedButton
                type="button"
                onClick={() => setShowBorrowModal(false)}
                variant="outline"
                size="md"
              >
                Batal
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                variant="success"
                size="md"
              >
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
          confirmText="Saya setuju untuk meminjam buku ini dan akan mengembalikannya sesuai tanggal jatuh tempo."
          onConfirm={confirmBorrow}
          onCancel={cancelBorrow}
        />
      )}
    </div>
  );
};

export default BorrowBooksPage;