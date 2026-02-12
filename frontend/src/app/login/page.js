// app/login/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LockClosedIcon, EnvelopeIcon, BookOpenIcon, ChevronLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Redirect based on user role
      if (result.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <motion.div
        className="relative w-full max-w-md overflow-hidden border shadow-lg bg-card rounded-2xl border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Back button */}
        <Link
          href="/landing"
          className="absolute z-10 flex items-center p-2 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm top-4 left-4 hover:bg-gray-50"
          aria-label="Kembali ke halaman utama"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-1 text-primary-600" />
          <span className="text-sm font-medium text-primary-600">Kembali</span>
        </Link>

        {/* Header with logo */}
        <div className="p-8 text-center bg-gradient-to-r from-primary to-indigo-600">
          <div className="flex justify-center mb-4">
            <div className="p-4 border rounded-full shadow-lg bg-white/20 backdrop-blur-sm border-white/30">
              <BookOpenIcon className="text-white h-14 w-14" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Sanbook</h1>
          {/* <h1 className="text-2xl font-bold text-white">Sistem Peminjaman Buku</h1> */}
          <p className="mt-2 text-white/90">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <motion.div
              className="p-3 mb-4 border rounded-lg bg-destructive/10 text-destructive border-destructive/20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="relative mb-4">
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-foreground">
              Alamat Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full py-3 pl-12 pr-4 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                placeholder="Masukkan email Anda"
              />
              <div className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2">
                <EnvelopeIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="relative mb-6">
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-foreground">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full py-3 pl-12 pr-12 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                placeholder="Masukkan kata sandi Anda"
              />
              <div className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <button
                type="button"
                className="absolute text-gray-400 transform -translate-y-1/2 right-4 top-1/2 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-primary-foreground font-semibold transition-all duration-200 ${
              loading
                ? 'bg-primary/70 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 active:scale-[0.98] shadow-md hover:shadow-lg'
            }`}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2 -ml-1 animate-spin text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sedang masuk...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Masuk
              </span>
            )}
          </motion.button>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link href="/register" className="font-medium transition-colors text-primary hover:text-primary/80 hover:underline">
                Daftar di sini
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}