// app/admin/categories/page.js
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
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import AnimatedButton from "../../../components/AnimatedButton";

const CategoriesPage = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchCategories();
  }, [token, debouncedSearchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/categories?search=${debouncedSearchTerm}&limit=100&sort_by=id&sort_order=ASC`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleDeleteCategory = async (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${categoryToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchCategories(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Kategori "${categoryToDelete.name}" berhasil dihapus!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || "Gagal menghapus kategori",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting category:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menghapus kategori",
        type: "error",
      });
    }

    // Close confirmation modal
    setShowDeleteConfirmation(false);
    setCategoryToDelete(null);
  };

  const cancelDeleteCategory = () => {
    setShowDeleteConfirmation(false);
    setCategoryToDelete(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (editingCategory) {
        // Update existing category
        response = await fetch(
          `http://localhost:5000/api/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          },
        );
      } else {
        // Create new category
        response = await fetch("http://localhost:5000/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        setShowModal(false);
        setFormData({
          name: "",
          description: "",
        });
        fetchCategories(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: editingCategory
            ? `Kategori "${formData.name}" berhasil diperbarui!`
            : `Kategori "${formData.name}" berhasil ditambahkan!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message:
            errorData.message ||
            (editingCategory
              ? "Gagal memperbarui kategori"
              : "Gagal menambahkan kategori"),
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving category:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menyimpan kategori",
        type: "error",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Export categories as .xlsx using exceljs so Excel opens with proper headers and autofilter
  const handleExportCSV = async () => {
    try {
      const mod = await import("exceljs");
      const ExcelJS = mod && mod.default ? mod.default : mod;

      const headers = ["ID", "Nama", "Deskripsi", "Tanggal Ditambahkan"];
      const rows = (categories || []).map((c) => [
        c.id,
        c.name,
        c.description || "",
        c.created_at ? new Date(c.created_at).toLocaleString("id-ID") : "",
      ]);

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Categories");
      ws.addRow(headers);
      rows.forEach((r) => ws.addRow(r));
      ws.autoFilter = {
        from: { col: 1, row: 1 },
        to: { col: headers.length, row: rows.length + 1 },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `categories_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Nama" },
    {
      key: "description",
      header: "Deskripsi",
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

  const actions = [
    {
      label: "Edit",
      onClick: handleEditCategory,
      className: "text-blue-600 hover:text-blue-900",
      icon: PencilIcon,
    },
    {
      label: "Hapus",
      onClick: handleDeleteCategory,
      className: "text-red-600 hover:text-red-900",
      icon: TrashIcon,
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Kelola Kategori Buku"
        headerActions={
          <div className="flex items-center">
            <AnimatedButton
              onClick={handleAddCategory}
              variant="primary"
              size="md"
              className="flex items-center min-w-[100px]"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2 cursor-pointer" />
              Tambah Kategori
            </AnimatedButton>
            <AnimatedButton
              onClick={handleExportCSV}
              variant="secondary"
              size="md"
              className="flex items-center ml-3"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2 cursor-pointer " />
              Ekspor
            </AnimatedButton>
          </div>
        }
      >
        <div className="relative max-w-md mb-4">
          <input
            type="text"
            placeholder="Cari kategori..."
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
          <Table columns={columns} data={categories} actions={actions} />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? "Edit Kategori" : "Tambah Kategori"}
      >
        <form onSubmit={handleSubmit}>
          <InputField
            label="Nama"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Masukkan nama kategori"
            required
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
              placeholder="Masukkan deskripsi kategori"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>

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
              {editingCategory ? "Simpan" : "Buat"}
            </AnimatedButton>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Delete */}
      {showDeleteConfirmation && categoryToDelete && (
        <ConfirmationCheckbox
          message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Saya setuju untuk menghapus kategori ini secara permanen."
          onConfirm={confirmDeleteCategory}
          onCancel={cancelDeleteCategory}
        />
      )}

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

export default CategoriesPage;
