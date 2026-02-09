-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 09 Feb 2026 pada 08.05
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `perpus`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `author` varchar(150) NOT NULL,
  `publication_year` year(4) DEFAULT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `available_copies` int(11) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cover_image` varchar(255) DEFAULT NULL,
  `ebook_file` varchar(255) DEFAULT NULL,
  `ebook_link` varchar(255) DEFAULT NULL,
  `page_count` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `publication_year`, `isbn`, `category_id`, `available_copies`, `description`, `created_at`, `updated_at`, `cover_image`, `ebook_file`, `ebook_link`, `page_count`) VALUES
(1, '3726 MDPL', 'Nurwina Sari', '2023', '978-6-2331-0259-9', 9, 165, 'Novel ini mengisahkan tentang Rangga, mahasiswa pecinta alam, yang berjuang mendapatkan hati Andini, mahasiswi berprestasi, selama empat tahun. Cerita berfokus pada dinamika hubungan mereka, termasuk trauma masa lalu Andini, tekanan keluarga, dan persaingan. Pendakian Gunung Rinjani (3.726 mdpl) menjadi metafora perjalanan emosional mereka untuk mendapatkan kebahagiaan dan penyembuhan. ', '2026-01-30 10:58:39', '2026-02-09 06:04:29', '/uploads/book-covers/book-cover-1770457878694-829648125.jpg', NULL, NULL, NULL),
(9, 'test 1', 'person', '2022', '298298982', 9, 12, 'test 1', '2026-02-06 01:32:09', '2026-02-09 06:00:34', NULL, NULL, NULL, NULL),
(10, 'test 2', 'person', '2023', '387386363', 3, 9, NULL, '2026-02-06 01:32:35', '2026-02-06 11:38:34', NULL, NULL, NULL, NULL),
(11, 'test 3', 'person', '2024', '3636363', 11, 11, NULL, '2026-02-06 01:33:09', '2026-02-09 06:03:22', NULL, NULL, NULL, NULL),
(12, 'test 4', 'person', '2024', '3333333', 5, 9, NULL, '2026-02-06 01:33:36', '2026-02-06 03:10:45', NULL, NULL, NULL, NULL),
(13, 'test 5', 'person', '2022', '3737373737', 10, 13, NULL, '2026-02-06 01:34:05', '2026-02-06 19:01:48', NULL, NULL, NULL, NULL),
(14, 'E-book next.js', 'Flavio copes', '0000', NULL, 10, 0, 'e-book test', '2026-02-07 17:40:51', '2026-02-09 06:13:24', '/uploads/book-covers/book-cover-1770486051151-862081552.png', '/uploads/ebooks/ebook-1770486050772-11855079.pdf', 'https://dtc-wsuv.org/dmyers19/dtc477-%20Advanced%20Multimedia%20Authoring/FlavioCopes-Handbooks/The%20Next%20Handbook/book.pdf', 102);

-- --------------------------------------------------------

--
-- Struktur dari tabel `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Fiksi', 'Sastra fiksi dan novel', '2026-01-20 02:16:03', '2026-01-30 10:54:18'),
(2, 'Sains', 'Buku ilmiah dan penelitian', '2026-01-20 02:16:03', '2026-01-30 10:54:46'),
(3, 'Sejarah', 'Catatan sejarah dan biografi', '2026-01-20 02:16:03', '2026-01-30 10:55:08'),
(4, 'Teknologi', 'Buku-buku ilmu komputer dan teknologi', '2026-01-20 02:16:03', '2026-01-30 10:55:33'),
(5, 'Komedi', 'Dirancang khusus untuk tertawa, menghibur, dan menyenangkan', '2026-01-20 02:16:03', '2026-01-30 10:57:46'),
(8, 'Romantis', NULL, '2026-01-20 02:16:03', '2026-01-30 12:01:07'),
(9, 'Petualangan', NULL, '2026-01-30 12:05:38', '2026-01-30 12:05:38'),
(10, 'Pelajaran', NULL, '2026-01-30 12:27:28', '2026-01-30 12:27:28'),
(11, 'Pertanian', 'agrobisnis, pupuk, fermentasi', '2026-02-06 01:25:13', '2026-02-06 01:25:13');

-- --------------------------------------------------------

--
-- Struktur dari tabel `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` datetime DEFAULT NULL,
  `status` enum('borrowed','returned','overdue','pending','approved') DEFAULT 'borrowed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fine_amount` decimal(10,2) DEFAULT 0.00,
  `quantity` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `book_id`, `borrow_date`, `due_date`, `return_date`, `status`, `created_at`, `updated_at`, `fine_amount`, `quantity`) VALUES
(40, 9, 1, '2026-02-06', '2026-02-07', '2026-02-09 13:04:29', 'returned', '2026-02-05 19:01:05', '2026-02-09 06:04:29', 2000.00, 5),
(41, 12, 1, '2026-02-07', '2026-02-08', '2026-02-09 13:03:44', 'returned', '2026-02-06 19:06:25', '2026-02-09 06:03:44', 1000.00, 5),
(42, 4, 9, '2026-01-01', '2026-01-08', '2026-02-09 13:00:34', 'overdue', '2026-02-06 19:11:34', '2026-02-09 06:06:17', 32000.00, 2),
(44, 4, 14, '2026-02-09', '2026-02-10', NULL, 'borrowed', '2026-02-09 06:12:35', '2026-02-09 06:13:24', 0.00, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','student') NOT NULL DEFAULT 'student',
  `class` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_picture` varchar(255) DEFAULT NULL,
  `nisn` varchar(20) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `max_borrow_limit` int(11) DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `class`, `address`, `created_at`, `updated_at`, `profile_picture`, `nisn`, `phone_number`, `max_borrow_limit`) VALUES
(1, 'Admin', 'admin@perpus', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '', NULL, '2026-02-06 12:20:49', '2026-02-06 13:33:37', NULL, NULL, NULL, 0),
(4, 'ali', 'ali@perpus', '$2a$10$YVrPgPNe8th0DYTnu5W0rOzlh89fo9Iix6Si1hzHCCVT43ECmx5Im', 'student', 'X ikuwes', 'etan kali', '2026-01-20 05:13:24', '2026-02-05 02:41:56', '/uploads/profile-images/4-1769134585456-14417364.jpg', '1919191', '188181881', 5),
(9, 'itqon', 'itqon@perpus', '$2a$10$.yv0lUwhAEX/4kwnePzEfutAXX3qXZxhZfMUZyDgtJ1Lkj6wRD7N2', 'student', 'XII RPL', 'paleran', '2026-02-06 01:29:59', '2026-02-06 01:29:59', NULL, '3838838383', '39893893', 5),
(12, 'isan', 'isan@perpus', '$2a$10$7mjwv8byiXkTuyybAHxvv.ZghJ9pv0.slb8WoAvZoOV6MFtMcBnGm', 'student', '12 RPL 2', 'salaans', '2026-02-06 19:06:03', '2026-02-06 19:06:03', NULL, '277277', '37837387', 5);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `isbn` (`isbn`),
  ADD KEY `category_id` (`category_id`);

--
-- Indeks untuk tabel `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeks untuk tabel `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `nisn` (`nisn`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT untuk tabel `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `books`
--
ALTER TABLE `books`
  ADD CONSTRAINT `books_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
