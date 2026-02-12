// components/student/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { HomeIcon, BookOpenIcon, IdentificationIcon, BookmarkSquareIcon, ArrowUturnUpIcon, MagnifyingGlassIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useState } from 'react';
import DynamicNotification from '../DynamicNotification';

const StudentSidebar = ({ setSidebarOpen }) => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const menuItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
    { name: 'Profil Saya', href: '/student/profile', icon: IdentificationIcon },
    { name: 'Buku Saya', href: '/student/my-books', icon: BookOpenIcon },
    { name: 'Pinjam Buku', href: '/student/borrow', icon: BookmarkSquareIcon },
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
        <div className="flex items-center justify-between">
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
                Sanbook
              </motion.h1>
              <motion.p
                className="text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Portal Siswa
              </motion.p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          {setSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 md:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen && setSidebarOpen(false)} // Close sidebar on mobile when clicking link
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <span className="truncate">{item.name}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 mt-auto border-t border-gray-200">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogoutClick}
          className="flex items-center justify-center w-full px-4 py-2.5 text-white transition bg-red-500 rounded-lg hover:bg-red-600 text-sm font-medium"
        >
          <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-2" />
          Keluar
        </motion.button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm">
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

export default StudentSidebar;