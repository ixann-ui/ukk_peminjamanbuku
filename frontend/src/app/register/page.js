// app/register/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  AcademicCapIcon,
  UserPlusIcon,
  ChevronLeftIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    class: "",
    address: "",
    nisn: "",
    phone_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validasi password harus mengandung setidaknya satu huruf besar
    if (!/[A-Z]/.test(formData.password)) {
      setError("Password harus mengandung setidaknya satu huruf besar");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi tidak cocok");
      setLoading(false);
      return;
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role,
      formData.class,
      formData.address,
      formData.nisn,
      formData.phone_number,
    );

    if (result.success) {
      // Redirect based on user role
      if (result.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
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
          href="/login"
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
              <UserPlusIcon className="text-white h-14 w-14" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Daftar Akun Siswa Baru
          </h1>
          {/* <p className="mt-2 text-white/90">Daftar akun siswa baru</p> */}
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
            <label
              htmlFor="name"
              className="block mb-1 text-sm font-medium text-foreground"
            >
              Nama Lengkap
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full py-3 pl-12 pr-4 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                placeholder="Masukkan nama lengkap Anda"
              />
              <div className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2">
                <UserIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <label
              htmlFor="email"
              className="block mb-1 text-sm font-medium text-foreground"
            >
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

          <div className="relative mb-4">
            <label className="block mb-1 text-sm font-medium text-foreground">
              Peran
            </label>
            <div className="flex items-center px-4 py-3 border rounded-lg bg-background border-input">
              <AcademicCapIcon className="w-5 h-5 mr-3 text-gray-400" />
              <span className="text-sm text-gray-700">Siswa</span>
              <input type="hidden" name="role" value={formData.role} />
            </div>
          </div>

          {formData.role === "student" && (
            <>
              <div className="relative mb-4">
                <label
                  htmlFor="class"
                  className="block mb-1 text-sm font-medium text-foreground"
                >
                  Kelas
                </label>
                <input
                  type="text"
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full px-4 py-3 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                  placeholder="Masukkan kelas Anda (misalnya, 10-A)"
                />
              </div>

              <div className="relative mb-4">
                <label
                  htmlFor="nisn"
                  className="block mb-1 text-sm font-medium text-foreground"
                >
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  id="nisn"
                  name="nisn"
                  value={formData.nisn}
                  onChange={handleChange}
                  className="w-full px-4 py-3 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                  placeholder="Masukkan NISN Anda"
                />
              </div>
            </>
          )}

          <div className="relative mb-6">
            <label
              htmlFor="address"
              className="block mb-1 text-sm font-medium text-foreground"
            >
              Alamat
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
              placeholder="Masukkan alamat Anda"
            />
          </div>

          <div className="relative mb-4">
            <label
              htmlFor="phone_number"
              className="block mb-1 text-sm font-medium text-foreground"
            >
              Nomor HP
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full py-3 pl-12 pr-4 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                placeholder="Masukkan nomor HP Anda"
              />
              <div className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <label
              htmlFor="password"
              className="block mb-1 text-sm font-medium text-foreground"
            >
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
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Password harus mengandung setidaknya satu huruf besar
            </p>
          </div>

          <div className="relative mb-4">
            <label
              htmlFor="confirmPassword"
              className="block mb-1 text-sm font-medium text-foreground"
            >
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full py-3 pl-12 pr-12 transition-all duration-200 border rounded-lg border-input focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background hover:border-primary/30"
                placeholder="Konfirmasi kata sandi Anda"
              />
              <div className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <button
                type="button"
                className="absolute text-gray-400 transform -translate-y-1/2 right-4 top-1/2 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan konfirmasi kata sandi"
                    : "Tampilkan konfirmasi kata sandi"
                }
              >
                {showConfirmPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-primary-foreground font-semibold transition-all duration-200 ${
              loading
                ? "bg-primary/70 cursor-not-allowed"
                : "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 active:scale-[0.98] shadow-md hover:shadow-lg"
            }`}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-2 -ml-1 animate-spin text-primary-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Membuat Akun...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <UserPlusIcon className="w-5 h-5 mr-2" />
                Daftar
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
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="font-medium transition-colors text-primary hover:text-primary/80 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
