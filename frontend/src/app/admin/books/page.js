// app/admin/books/page.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDebounce } from '../../../hooks/useDebounce';
import Card from '../../../components/Card';
import Table from '../../../components/Table';
import Modal from '../../../components/Modal';
import InputField from '../../../components/InputField';
import ConfirmationCheckbox from '../../../components/ConfirmationCheckbox';
import DynamicNotification from '../../../components/DynamicNotification';
import { PencilIcon, TrashIcon, PlusCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import AnimatedButton from '../../../components/AnimatedButton';

const BooksPage = () => {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publication_year: '',
    isbn: '',
    category_id: '',
    available_copies: 1,
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [token, debouncedSearchTerm]);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/books?search=${debouncedSearchTerm}&sort_by=id&sort_order=ASC`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBooks(data.books || []);
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

  const handleAddBook = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publication_year: '',
      isbn: '',
      category_id: '',
      available_copies: 1,
      description: ''
    });
    setShowModal(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publication_year: book.publication_year || '',
      isbn: book.isbn || '',
      category_id: book.category_id || '',
      available_copies: book.available_copies || 1,
      description: book.description || ''
    });
    setShowModal(true);
  };

  const handleDeleteBook = async (book) => {
    setBookToDelete(book);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/books/${bookToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchBooks(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Buku "${bookToDelete.title}" berhasil dihapus!`,
          type: 'success'
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || 'Gagal menghapus buku',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting book:', error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: 'Terjadi kesalahan saat menghapus buku',
        type: 'error'
      });
    }

    // Close confirmation modal
    setShowDeleteConfirmation(false);
    setBookToDelete(null);
  };

  const cancelDeleteBook = () => {
    setShowDeleteConfirmation(false);
    setBookToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convert available_copies to integer to ensure proper data type
      const submitData = {
        ...formData,
        available_copies: parseInt(formData.available_copies) || 1,
        publication_year: formData.publication_year ? parseInt(formData.publication_year, 10) : null
      };

      let response;
      if (editingBook) {
        // Update existing book
        response = await fetch(`http://localhost:5000/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        });
      } else {
        // Create new book
        response = await fetch('http://localhost:5000/api/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        });
      }

      if (response.ok) {
        setShowModal(false);
        setFormData({
          title: '',
          author: '',
          publication_year: '',
          isbn: '',
          category_id: '',
          available_copies: 1,
          description: ''
        });
        fetchBooks(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevState => ({
      ...prevState,
      [name]: name === 'available_copies' ? (value === '' ? 1 : parseInt(value, 10) || 1) :
             name === 'publication_year' ? (value === '' ? '' : parseInt(value, 10) || '') : value
    }));
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Judul' },
    { key: 'author', header: 'Penulis' },
    { key: 'publication_year', header: 'Tahun Terbit', render: (value) => value || '-' },
    { key: 'isbn', header: 'ISBN', render: (value) => value || '-' },
    { key: 'category_name', header: 'Kategori', render: (value) => value || '-' },
    { key: 'available_copies', header: 'Tersedia' },
    { key: 'created_at', header: 'Tanggal Ditambahkan', render: (value) => new Date(value).toLocaleDateString() }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEditBook,
      className: 'text-blue-600 hover:text-blue-900',
      icon: PencilIcon
    },
    {
      label: 'Hapus',
      onClick: handleDeleteBook,
      className: 'text-red-600 hover:text-red-900',
      icon: TrashIcon
    }
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Kelola Buku"
        headerActions={
          <AnimatedButton
            onClick={handleAddBook}
            variant="success"
            size="md"
          >
            <PlusCircleIcon className="w-5 mr-2 h-7" />
            Tambah Buku
          </AnimatedButton>
        }
      >
        <div className="relative max-w-md mb-4">
          <input
            type="text"
            placeholder="Cari buku..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="absolute text-gray-500 transform -translate-y-1/2 left-4 top-1/2">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={books} actions={actions} />
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBook ? 'Edit Buku' : 'Tambah Buku'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Judul"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masukkan judul buku"
            required
          />
          <InputField
            label="Penulis"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Masukkan penulis buku"
            required
          />
          <InputField
            label="Tahun Terbit"
            id="publication_year"
            name="publication_year"
            type="number"
            min="1000"
            max="2025"
            value={formData.publication_year}
            onChange={handleChange}
            placeholder="Masukkan tahun terbit buku"
          />
          <InputField
            label="ISBN"
            id="isbn"
            name="isbn"
            value={formData.isbn}
            onChange={handleChange}
            placeholder="Masukkan ISBN"
          />
          <div className="mb-4">
            <label htmlFor="category_id" className="block mb-1 text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
             {/* option */}
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <InputField
            key={`available-copies-${editingBook?.id || 'new'}`}
            label="Jumlah Tersedia"
            id="available_copies"
            name="available_copies"
            type="number"
            min="0"
            value={formData.available_copies}
            onChange={handleChange}
            placeholder="Masukkan jumlah buku yang tersedia"
            required
          />
          <div className="mb-4">
            <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Masukkan deskripsi buku"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>

          <div className="flex justify-end mt-6 space-x-3">
            <AnimatedButton
              type="button"
              onClick={() => setShowModal(false)}
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
              {editingBook ? 'Simpan' : 'Buat'}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirmation && bookToDelete && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin menghapus buku "${bookToDelete.title}" oleh ${bookToDelete.author}?`}
          confirmText="Saya setuju untuk menghapus buku ini secara permanen."
          onConfirm={confirmDeleteBook}
          onCancel={cancelDeleteBook}
        />
      )}

      {/* Dynamic Notification */}
      <DynamicNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ isVisible: false, message: '', type: 'success' })}
      />
    </div>
  );
};

export default BooksPage;