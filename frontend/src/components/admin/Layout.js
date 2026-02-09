// components/admin/Layout.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          className="fixed inset-0 z-40 bg-transparent bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always shown, mobile toggled */}
      <AnimatePresence>
        {(isMobile ? sidebarOpen : true) && (
          <motion.aside
            className={`fixed top-0 left-0 z-50 h-screen bg-white shadow-lg w-[260px] ${
              isMobile ? 'md:hidden' : 'hidden md:block'
            }`}
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <Sidebar setSidebarOpen={setSidebarOpen} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={`flex-1 min-h-screen overflow-x-hidden transition-all duration-300 ${
        isMobile ? 'ml-0' : 'md:ml-[260px]'
      }`}>
        {/* Mobile header with hamburger */}
        {isMobile && (
          <header className="sticky top-0 z-30 p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-800">Peminjaman Buku</h1>
              <div className="w-10"></div> {/* Spacer for symmetry */}
            </div>
          </header>
        )}

        <div className="max-w-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
