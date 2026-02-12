'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRightIcon, BookOpenIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect to their dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [user, loading, router]);

  // If user is loading or already logged in, show loading state
  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-primary">
            <BookOpenIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">Sanbook</span>
          {/* <span className="text-xl font-bold text-gray-800">Peminjaman buku</span> */}
        </div>
        <div className="flex items-center space-x-4">
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <motion.h1 
              className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Website Peminjaman Buku
            </motion.h1>
            <motion.p 
              className="max-w-3xl mx-auto mb-10 text-xl text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Platform digital untuk mengelola peminjaman buku di perpustakaan sekolah. 
              Mudah digunakan, efisien, dan membantu mengatur koleksi buku serta aktivitas peminjaman.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              <Link 
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
              >
                Masuk Sekarang
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium transition-colors bg-white border rounded-lg text-primary border-primary hover:bg-gray-50"
              >
                Buat Akun
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Fitur Utama</h2>
            <p className="max-w-2xl mx-auto text-gray-600">
              Sistem kami menawarkan berbagai fitur untuk memudahkan pengelolaan perpustakaan
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div 
              className="p-6 bg-gray-50 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-center w-12 h-12 p-3 mb-4 rounded-lg bg-primary/10">
                <BookOpenIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Manajemen Buku</h3>
              <p className="text-gray-600">
                Kelola koleksi buku dengan mudah, termasuk informasi detail seperti judul, penulis, dan jumlah stok.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-gray-50 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-center w-12 h-12 p-3 mb-4 rounded-lg bg-primary/10">
                <UserGroupIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Manajemen Anggota</h3>
              <p className="text-gray-600">
                Kelola data anggota perpustakaan dengan informasi lengkap dan sistem klasifikasi.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-6 bg-gray-50 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-center w-12 h-12 p-3 mb-4 rounded-lg bg-primary/10">
                <ClockIcon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Peminjaman & Pengembalian</h3>
              <p className="text-gray-600">
                Sistem peminjaman dan pengembalian buku dengan fitur denda otomatis untuk keterlambatan.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

    
      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="mb-4 text-3xl font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Siap Mulai Menggunakan Sistem Kami?
          </motion.h2>
          <motion.p 
            className="mb-8 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Bergabunglah dengan ribuan pengguna lainnya yang telah merasakan kemudahan dalam mengelola perpustakaan.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            {/* <Link 
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium transition-colors bg-white rounded-lg text-primary hover:bg-gray-100"
            >
              Masuk Sekarang
            </Link>
            <Link 
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white transition-colors border border-white rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              Buat Akun Gratis
            </Link> */}
          </motion.div>
        </div>
      </section>
    </div>
  );
}