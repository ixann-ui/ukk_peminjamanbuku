// app/admin/users/page.js
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

const UsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    class: '',
    address: '',
    nisn: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, message: '', type: 'success' });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchUsers();
  }, [token, debouncedSearchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users?search=${debouncedSearchTerm}&sort_by=id&sort_order=ASC`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      class: '',
      address: '',
      nisn: ''
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password for security
      role: user.role,
      class: user.class || '',
      address: user.address || '',
      nisn: user.nisn || ''
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (user) => {
    setUserToDelete(user);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Pengguna "${userToDelete.name}" berhasil dihapus!`,
          type: 'success'
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || 'Gagal menghapus pengguna',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: 'Terjadi kesalahan saat menghapus pengguna',
        type: 'error'
      });
    }

    // Close confirmation modal
    setShowDeleteConfirmation(false);
    setUserToDelete(null);
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirmation(false);
    setUserToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingUser) {
        // For editing, we only send fields that are actually being updated
        // Exclude password from the update payload for security
        const { password, ...updateData } = formData;
        response = await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });
      } else {
        // Create new user - include password, address, and nisn
        response = await fetch('http://localhost:5000/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'student',
          class: '',
          address: '',
          nisn: ''
        });
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Nama' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Peran' },
    { key: 'class', header: 'Kelas', render: (value) => value || '-' },
    { key: 'address', header: 'Alamat', render: (value) => value || '-' },
    { key: 'nisn', header: 'NISN', render: (value) => value || '-' },
    { key: 'created_at', header: 'Tanggal Dibuat', render: (value) => new Date(value).toLocaleDateString() }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEditUser,
      className: 'text-blue-600 hover:text-blue-900',
      icon: PencilIcon
    },
    {
      label: 'Hapus',
      onClick: handleDeleteUser,
      className: 'text-red-600 hover:text-red-900',
      icon: TrashIcon
    }
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Kelola Pengguna"
        headerActions={
          <AnimatedButton
            onClick={handleAddUser}
            variant="success"
            size="md"
          >
            <PlusCircleIcon className="w-5 mr-2 h-7" />
            Tambah Pengguna
          </AnimatedButton>
        }
      >
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
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
            <Table columns={columns} data={users} actions={actions} />
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}>
        <form onSubmit={handleSubmit}>
          <InputField
            label="Nama"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="Masukkan nama pengguna"
            required
          />
          <InputField
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="Masukkan email pengguna"
            required
          />
          {!editingUser && (
            <InputField
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password || ''}
              onChange={handleChange}
              placeholder="Masukkan password pengguna"
              required={!editingUser} // Password is required only when creating new users
            />
          )}
          <div className="mb-4">
            <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-700">
              Peran
            </label>
            <select
              id="role"
              name="role"
              value={formData.role || 'student'}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="student">Siswa</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <InputField
            label="Kelas"
            id="class"
            name="class"
            value={formData.class || ''}
            onChange={handleChange}
            placeholder="Masukkan kelas"
          />
          <InputField
            label="Alamat"
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            placeholder="Tambahkan alamat pengguna"
          />
          <InputField
            label="NISN"
            id="nisn"
            name="nisn"
            value={formData.nisn || ''}
            onChange={handleChange}
            placeholder="Masukkan NISN pengguna"
          />

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
              {editingUser ? 'Simpan' : 'Buat'}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirmation && userToDelete && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin menghapus pengguna "${userToDelete.name}" dengan email ${userToDelete.email}?`}
          confirmText="Saya setuju untuk menghapus pengguna ini secara permanen."
          onConfirm={confirmDeleteUser}
          onCancel={cancelDeleteUser}
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

export default UsersPage;