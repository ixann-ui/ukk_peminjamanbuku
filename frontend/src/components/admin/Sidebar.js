// components/admin/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { HomeIcon, UserGroupIcon, BookOpenIcon, TagIcon, CreditCardIcon, ArrowRightStartOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import DynamicNotification from '../DynamicNotification';

const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const menuItems = [
    { name: 'Buku', href: '/admin/books', icon: BookOpenIcon },
    { name: 'Kategori', href: '/admin/categories', icon: TagIcon },
    { name: 'Transaksi', href: '/admin/transactions', icon: CreditCardIcon },
  ];

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirmation(false);
    logout();
    setNotification({ show: true, message: 'Berhasil keluar dari akun', type: 'success' });
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <motion.aside
      className="fixed top-0 left-0 flex flex-col h-screen bg-white shadow-lg w-[260px] z-10"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BookOpenIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <motion.h1
              className="text-xl font-bold text-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
             Peminjaman Buku
            </motion.h1>
            <motion.p
              className="text-xs text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Panel Admin
            </motion.p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {/* Dashboard item */}
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Link
              href="/admin/dashboard"
              className={`flex items-center p-3 rounded-lg transition ${
                pathname === '/admin/dashboard'
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <HomeIcon className="w-5 h-5 mr-3" />
              <span className="truncate">Dashboard</span>
            </Link>
          </motion.li>

          {/* Manajemen Pengguna dropdown */}
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`flex items-center justify-between w-full p-3 rounded-lg transition ${
                  pathname.startsWith('/admin/users')
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-3 cursor-pointer"/>
                  <span className="truncate">Pengguna</span>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isUserDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.ul
                    className="pl-8 mt-1 space-y-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                  <li>
                    <Link
                      href="/admin/users?role=admin"
                      className={`flex items-center p-2 rounded-lg transition ${
                        pathname === '/admin/users' && searchParams.get('role') === 'admin'
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">Admin</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/users?role=student"
                      className={`flex items-center p-2 rounded-lg transition ${
                        pathname === '/admin/users' && searchParams.get('role') === 'student'
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">Siswa</span>
                    </Link>
                  </li>
                </motion.ul>
              )}
              </AnimatePresence>
            </div>
          </motion.li>

          {/* Other menu items */}
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: (index + 2) * 0.05 }} // Adjust delay for proper sequence
              >
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <motion.div
        className="p-4 border-t border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogoutClick}
          className="flex items-center justify-center w-full px-4 py-2 text-white transition bg-red-500 rounded-lg hover:bg-red-600"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-2" />
          Keluar
        </motion.button>
      </motion.div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50 back backdrop-blur-sm">
          <motion.div
            className="w-full max-w-md p-6 mx-4 bg-white rounded-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Yakin ingin Keluar?</h3>
            <p className="mb-6 text-gray-600">
              Apakah Anda yakin ingin keluar dari akun?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                Keluar
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
    </motion.aside>
  );
};

export default Sidebar;