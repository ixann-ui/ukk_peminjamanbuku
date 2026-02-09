// app/admin/books/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useDebounce } from "../../../hooks/useDebounce";
import Card from "../../../components/Card";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import InputField from "../../../components/InputField";
import ConfirmationCheckbox from "../../../components/ConfirmationCheckbox";
import DynamicNotification from "../../../components/DynamicNotification";
import {
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AnimatedButton from "../../../components/AnimatedButton";

const BooksPage = () => {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publication_year: "",
    isbn: "",
    category_id: "",
    available_copies: 1,
    page_count: "",
    description: "",
    cover_image: null,
    ebook_file: null,
    ebook_link: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [isAddingEbook, setIsAddingEbook] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [token, debouncedSearchTerm]);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownButton = document.querySelector("[data-dropdown-button]");
      const dropdownMenu = document.querySelector("[data-dropdown-menu]");

      if (
        showDropdown &&
        dropdownButton &&
        dropdownMenu &&
        !dropdownButton.contains(event.target) &&
        !dropdownMenu.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const fetchBooks = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/books?search=${debouncedSearchTerm}&sort_by=id&sort_order=ASC`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleAddBook = () => {
    setEditingBook(null);
    setIsAddingEbook(false); // Mode menambah buku biasa
    setFormData({
      title: "",
      author: "",
      publication_year: "",
      isbn: "",
      category_id: "",
      available_copies: 1,
      description: "",
      cover_image: null,
      // Untuk buku biasa, kita tidak menampilkan field e-book
      ebook_file: null,
      ebook_link: "",
    });
    setShowModal(true);
  };

  const handleAddEbook = () => {
    setEditingBook(null);
    setIsAddingEbook(true); // Mode menambah e-book
    setFormData({
      title: "",
      author: "",
      publication_year: "",
      isbn: "",
      category_id: "",
      available_copies: 1,
      description: "",
      cover_image: null,
      // Untuk e-book, kita siapkan field e-book
      ebook_file: null,
      ebook_link: "",
    });
    setShowModal(true);
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publication_year: book.publication_year || "",
      isbn: book.isbn || "",
      category_id: book.category_id || "",
      available_copies: book.available_copies || 1,
      page_count: book.page_count || "",
      description: book.description || "",
      cover_image: book.cover_image || null,
      ebook_file: book.ebook_file || null,
      ebook_link: book.ebook_link || "",
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
      const response = await fetch(
        `http://localhost:5000/api/books/${bookToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchBooks(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Buku "${bookToDelete.title}" berhasil dihapus!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || "Gagal menghapus buku",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting book:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menghapus buku",
        type: "error",
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
      // Create FormData object to handle file upload
      const formDataToSend = new FormData();

      // Append all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key === "cover_image" && formData[key]) {
          // Only append file if it's selected
          if (formData[key] instanceof File) {
            formDataToSend.append("cover_image", formData[key]);
          }
        } else if (key === "ebook_file" && formData[key] && isAddingEbook) {
          // Only append ebook file if it's selected and in ebook mode
          if (formData[key] instanceof File) {
            formDataToSend.append("ebook_file", formData[key]);
          }
        } else if (key === "ebook_link" && isAddingEbook) {
          // Only append ebook link in ebook mode (can be empty)
          formDataToSend.append(key, formData[key] || "");
        } else if (
          key !== "cover_image" &&
          key !== "ebook_file" &&
          key !== "ebook_link"
        ) {
          // Append other fields except cover_image, ebook_file, and ebook_link
          if (key === "available_copies") {
            formDataToSend.append(key, parseInt(formData[key]) || 1);
          } else if (key === "publication_year") {
            formDataToSend.append(
              key,
              formData[key] ? parseInt(formData[key], 10) : null,
            );
          } else if (key === "page_count") {
            formDataToSend.append(
              key,
              formData[key] ? parseInt(formData[key], 10) : null,
            );
          } else {
            formDataToSend.append(key, formData[key] || "");
          }
        }
      });

      let response;
      if (editingBook) {
        // Update existing book
        response = await fetch(
          `http://localhost:5000/api/books/${editingBook.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataToSend,
          },
        );
      } else {
        // Create new book
        response = await fetch("http://localhost:5000/api/books", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        });
      }

      if (response.ok) {
        setShowModal(false);
        setIsAddingEbook(false); // Reset to default mode
        setFormData({
          title: "",
          author: "",
          publication_year: "",
          isbn: "",
          category_id: "",
          available_copies: 1,
          page_count: "",
          description: "",
          cover_image: null,
          ebook_file: null,
          ebook_link: "",
        });
        fetchBooks(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving book:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]:
        name === "available_copies"
          ? value === ""
            ? 1
            : parseInt(value, 10) || 1
          : name === "publication_year"
            ? value === ""
              ? ""
              : parseInt(value, 10) || ""
            : name === "page_count"
              ? value === ""
                ? ""
                : parseInt(value, 10) || ""
              : name === "ebook_link"
                ? value
                : value,
    }));
  };

  const selectedFileName =
    formData.cover_image && typeof formData.cover_image !== "string"
      ? formData.cover_image.name
      : "";

  const columns = [
    {
      key: "cover_image",
      header: "Cover",
      render: (value) =>
        value ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${value}`}
            alt="Cover"
            className="object-cover w-12 mx-auto rounded h-18"
          />
        ) : (
          <div className="w-12 aspect-[2/3] mx-auto flex items-center justify-center text-gray-400"></div>
        ),
    },
    { key: "id", header: "ID" },
    { key: "title", header: "Judul" },
    { key: "author", header: "Penulis" },
    {
      key: "publication_year",
      header: "Tahun Terbit",
      render: (value) => value || "-",
    },
    { key: "isbn", header: "ISBN", render: (value) => value || "-" },
    {
      key: "category_name",
      header: "Kategori",
      render: (value) => value || "-",
    },
    { key: "available_copies", header: "Tersedia" },
    {
      key: "page_count",
      header: "Jumlah Halaman",
      render: (value) => value || "-",
    },
    {
      key: "created_at",
      header: "Tanggal Ditambahkan",
      render: (value) =>
        new Date(value).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
  ];

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const handleViewBook = (book) => {
    setSelectedBook(book);
    setShowDetailModal(true);
  };

  const actions = [
    {
      label: "Lihat",
      onClick: handleViewBook,
      className: "text-green-600 hover:text-green-900",
      icon: EyeIcon,
      showLabel: false, // Hanya tampilkan ikon tanpa teks
    },
    {
      label: "Edit",
      onClick: handleEditBook,
      className: "text-blue-600 hover:text-blue-900",
      icon: PencilIcon,
    },
    {
      label: "Hapus",
      onClick: handleDeleteBook,
      className: "text-red-600 hover:text-red-900",
      icon: TrashIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Kelola Buku"
        headerActions={
          <div className="relative">
            <AnimatedButton
              data-dropdown-button
              onClick={() => setShowDropdown(!showDropdown)}
              variant="primary"
              size="md"
              className="flex items-center justify-center min-w-[140px]"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Tambah Buku
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </AnimatedButton>

            {showDropdown && (
              <div
                data-dropdown-menu
                className="absolute right-0 z-10 w-48 mt-3 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-gray-400 ring-opacity-5"
              >
                <div className="py-1" role="menu">
                  <button
                    onClick={() => {
                      handleAddBook();
                      setShowDropdown(false);
                    }}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Tambah Buku
                  </button>
                  <button
                    onClick={() => {
                      handleAddEbook();
                      setShowDropdown(false);
                    }}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Tambah E-book
                  </button>
                </div>
              </div>
            )}
          </div>
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBook ? "Edit Buku" : "Tambah Buku"}
      >
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
            <label
              htmlFor="category_id"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
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
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <InputField
            key={`available-copies-${editingBook?.id || "new"}`}
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
          <InputField
            label="Jumlah Halaman"
            id="page_count"
            name="page_count"
            type="number"
            min="1"
            value={formData.page_count || ""}
            onChange={handleChange}
            placeholder="Masukkan jumlah halaman buku"
          />
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
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

          {/* Cover Image Upload */}
          <div className="mb-4">
            <label
              htmlFor="cover_image"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Cover Buku
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                id="cover_image"
                name="cover_image"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setFormData((prev) => ({
                    ...prev,
                    cover_image: file,
                  }));
                }}
                className="hidden"
              />

              <label
                htmlFor="cover_image"
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {!selectedFileName && (
                  <span className="text-sm text-gray-700">Pilih File</span>
                )}
              </label>

              <span className="max-w-xs text-sm text-gray-600 truncate">
                {selectedFileName}
              </span>
            </div>

            {(editingBook &&
              editingBook.cover_image &&
              !formData.cover_image) ||
            (formData.cover_image &&
              typeof formData.cover_image !== "string") ? (
              <div className="mt-4 text-center">
                <p className="mb-2 text-sm text-gray-600">
                  {formData.cover_image &&
                  typeof formData.cover_image !== "string"
                    ? "Preview cover baru:"
                    : "Cover saat ini:"}
                </p>
                <img
                  src={
                    formData.cover_image &&
                    typeof formData.cover_image !== "string"
                      ? URL.createObjectURL(formData.cover_image)
                      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${editingBook.cover_image}`
                  }
                  alt={
                    formData.cover_image &&
                    typeof formData.cover_image !== "string"
                      ? "Preview cover baru"
                      : "Current cover"
                  }
                  className="object-cover h-48 mx-auto border rounded w-36"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* E-book File Upload - Only show when adding e-book */}
          {isAddingEbook && (
            <div className="mb-4">
              <label
                htmlFor="ebook_file"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                File E-book
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  id="ebook_file"
                  name="ebook_file"
                  accept=".pdf,.epub,.mobi"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setFormData((prev) => ({
                      ...prev,
                      ebook_file: file,
                    }));
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="ebook_file"
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {!formData.ebook_file && (
                    <span className="text-sm text-gray-700">Pilih File</span>
                  )}
                </label>

                <span className="max-w-xs text-sm text-gray-600 truncate">
                  {formData.ebook_file ? formData.ebook_file.name : ""}
                </span>
              </div>

              {editingBook &&
                editingBook.ebook_file &&
                !formData.ebook_file && (
                  <div className="mt-2 text-sm text-gray-600">
                    File e-book saat ini:{" "}
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${editingBook.ebook_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {editingBook.ebook_file.split("/").pop()}
                    </a>
                  </div>
                )}
            </div>
          )}

          {/* E-book Link - Only show when adding e-book */}
          {isAddingEbook && (
            <div className="mb-4">
              <label
                htmlFor="ebook_link"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Link E-book Online
              </label>
              <input
                type="url"
                id="ebook_link"
                name="ebook_link"
                value={formData.ebook_link}
                onChange={handleChange}
                placeholder="https://contoh.com/ebook.pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Masukkan URL lengkap jika ingin membaca E-book secara online
              </p>
            </div>
          )}

          <div className="flex justify-end mt-6 space-x-3">
            <AnimatedButton
              type="button"
              onClick={() => setShowModal(false)}
              variant="danger"
              size="md"
            >
              Batal
            </AnimatedButton>
            <AnimatedButton type="submit" variant="primary" size="md">
              {editingBook ? "Simpan" : "Buat"}
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

      {/* Detail Book Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Detail Buku"
      >
        {selectedBook && (
          <div className="space-y-4">
            <div className="flex justify-center">
              {selectedBook.cover_image ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${selectedBook.cover_image}`}
                  alt={selectedBook.title}
                  className="object-cover w-48 h-64 border rounded"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-48 h-64 border-2 border-gray-300 border-dashed rounded">
                  <span className="text-gray-500">Tidak ada cover</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Judul</p>
                <p className="text-gray-900">{selectedBook.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Penulis</p>
                <p className="text-gray-900">{selectedBook.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tahun Terbit
                </p>
                <p className="text-gray-900">
                  {selectedBook.publication_year || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">ISBN</p>
                <p className="text-gray-900">{selectedBook.isbn || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Kategori</p>
                <p className="text-gray-900">
                  {selectedBook.category_name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tersedia</p>
                <p className="text-gray-900">{selectedBook.available_copies}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Jumlah Halaman
                </p>
                <p className="text-gray-900">
                  {selectedBook.page_count || "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Deskripsi</p>
              <p className="text-gray-900">{selectedBook.description || "-"}</p>
            </div>

            {/* E-book Information */}
            {(selectedBook.ebook_link || selectedBook.ebook_file) && (
              <div className="pt-4 border-t border-gray-200">
                <p className="mb-2 text-sm font-medium text-gray-500">E-book</p>
                {selectedBook.ebook_link && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">Link E-book:</p>
                    <a
                      href={selectedBook.ebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 break-all hover:underline"
                    >
                      {selectedBook.ebook_link}
                    </a>
                  </div>
                )}
                {selectedBook.ebook_file && (
                  <div>
                    <p className="text-sm text-gray-500">File E-book:</p>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${selectedBook.ebook_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 break-all hover:underline"
                    >
                      {selectedBook.ebook_file.split("/").pop() ||
                        "Download E-book"}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <p className="text-sm font-medium text-gray-500">
                Tanggal Ditambahkan
              </p>
              <p className="text-gray-900">
                {new Date(selectedBook.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <AnimatedButton
            type="button"
            onClick={() => setShowDetailModal(false)}
            variant="danger"
            size="md"
          >
            Tutup
          </AnimatedButton>
        </div>
      </Modal>

      {/* Dynamic Notification */}
      <DynamicNotification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() =>
          setNotification({ isVisible: false, message: "", type: "success" })
        }
      />
    </div>
  );
};

export default BooksPage;
