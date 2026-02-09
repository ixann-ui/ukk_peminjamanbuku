// app/admin/users/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useDebounce } from "../../../hooks/useDebounce";
import { useSearchParams } from "next/navigation";
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
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedButton from "../../../components/AnimatedButton";

const UsersPage = () => {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    class: "",
    address: "",
    nisn: "",
    phone_number: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [notification, setNotification] = useState({
    isVisible: false,
    message: "",
    type: "success",
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const roleParam = searchParams.get("role"); // Get role from URL parameter

  useEffect(() => {
    fetchUsers();
  }, [token, debouncedSearchTerm, roleParam]);

  const fetchUsers = async () => {
    try {
      // Build the query string with role parameter if present
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        sort_by: "id",
        sort_order: "ASC",
      });

      if (roleParam) {
        params.append("role", roleParam);
      }

      const queryString = params.toString();
      const response = await fetch(
        `http://localhost:5000/api/users?${queryString}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    // Default role when adding depends on the current listing (roleParam)
    const defaultRole =
      roleParam === "admin"
        ? "admin"
        : roleParam === "student"
          ? "student"
          : "student";
    setFormData({
      name: "",
      email: "",
      password: "",
      role: defaultRole,
      class: "",
      address: "",
      nisn: "",
      phone_number: "",
      confirm_password: "",
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password for security
      role: user.role,
      class: user.class || "",
      address: user.address || "",
      nisn: user.nisn || "",
      phone_number: user.phone_number || "",
      confirm_password: "",
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
      const response = await fetch(
        `http://localhost:5000/api/users/${userToDelete.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        fetchUsers(); // Refresh the list

        // Show success notification
        setNotification({
          isVisible: true,
          message: `Pengguna "${userToDelete.name}" berhasil dihapus!`,
          type: "success",
        });
      } else {
        const errorData = await response.json();

        // Show error notification
        setNotification({
          isVisible: true,
          message: errorData.message || "Gagal menghapus pengguna",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);

      // Show error notification
      setNotification({
        isVisible: true,
        message: "Terjadi kesalahan saat menghapus pengguna",
        type: "error",
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
        const updateData = { ...formData };
        // If a password is provided on edit, validate and include it
        if (formData.password) {
          // Must contain at least one uppercase letter
          if (!/[A-Z]/.test(formData.password)) {
            setNotification({
              isVisible: true,
              message: "Password harus mengandung setidaknya satu huruf besar",
              type: "error",
            });
            return;
          }
          if (formData.password !== formData.confirm_password) {
            setNotification({
              isVisible: true,
              message: "Password dan konfirmasi password tidak cocok",
              type: "error",
            });
            return;
          }
          // keep password in payload
        } else {
          // Remove password fields if empty or not applicable
          delete updateData.password;
          delete updateData.confirm_password;
        }

        response = await fetch(
          `http://localhost:5000/api/users/${editingUser.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
          },
        );
      } else {
        // validate confirm password when creating
        if (formData.password !== formData.confirm_password) {
          setNotification({
            isVisible: true,
            message: "Password dan konfirmasi password tidak cocok",
            type: "error",
          });
          return;
        }
        // Enforce uppercase rule for all new users' passwords
        if (!/[A-Z]/.test(formData.password)) {
          setNotification({
            isVisible: true,
            message: "Password harus mengandung setidaknya satu huruf besar",
            type: "error",
          });
          return;
        }
        // Create new user - include password, address, and nisn
        const payload = { ...formData };
        delete payload.confirm_password;
        response = await fetch("http://localhost:5000/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        setShowModal(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "student",
          class: "",
          address: "",
          nisn: "",
          phone_number: "",
        });
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        setNotification({
          isVisible: true,
          message: errorData.message || "Operation failed",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Show fewer columns when listing admins; show full columns for students/others
  const baseColumns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Nama" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Peran",
      render: (value) => (
        <span
          className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs ${
            value === "admin"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {value === "admin" ? "Admin" : "Siswa"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Tanggal Dibuat",
      render: (value) =>
        new Date(value).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    },
  ];

  const studentExtraColumns = [
    { key: "phone_number", header: "No HP", render: (value) => value || "-" },
    { key: "class", header: "Kelas", render: (value) => value || "-" },
    { key: "address", header: "Alamat", render: (value) => value || "-" },
    { key: "nisn", header: "NISN", render: (value) => value || "-" },
  ];

  const columns =
    roleParam === "admin"
      ? baseColumns
      : // for students and other listings include extra student-specific columns
        [
          baseColumns[0], // id
          baseColumns[1], // name
          baseColumns[2], // email
          ...studentExtraColumns,
          baseColumns[3], // role
          baseColumns[4], // created_at
        ];

  const actions = [
    {
      label: "Edit",
      onClick: handleEditUser,
      className: "text-blue-600 hover:text-blue-900",
      icon: PencilIcon,
    },
    {
      label: "Hapus",
      onClick: handleDeleteUser,
      className: "text-red-600 hover:text-red-900",
      icon: TrashIcon,
    },
  ];

  const isAdding = !editingUser;

  // Show student-specific fields when editing a student OR when creating a student
  // while viewing the student listing (so admin add on admin listing won't show them)
  const showStudentFields =
    (editingUser && formData.role === "student") ||
    (isAdding && formData.role === "student" && roleParam !== "admin");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${roleParam || "all"}-${searchTerm}`} // Key changes when role or search changes to trigger animation
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          title="Kelola Pengguna"
          headerActions={
            <div className="flex items-center">
              <AnimatedButton
                onClick={handleAddUser}
                variant="primary"
                size="md"
                className="flex items-center min-w-[100px]"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2 cursor-pointer" />
                Tambah Pengguna
              </AnimatedButton>
            </div>
          }
        >
          <div className="relative max-w-md mb-4">
            <input
              type="text"
              placeholder="Cari pengguna..."
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
              <Table columns={columns} data={users} actions={actions} />
            </div>
          )}
        </Card>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? "Edit Pengguna" : "Tambah Pengguna"}
        >
          <form onSubmit={handleSubmit}>
            <InputField
              label="Nama"
              id="name"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Masukkan nama pengguna"
              required
            />
            <InputField
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="Masukkan email pengguna"
              required
            />
            <>
              <InputField
                label="Password"
                id="password"
                name="password"
                type="password"
                isPassword
                show={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
                value={formData.password || ""}
                onChange={handleChange}
                placeholder={
                  editingUser
                    ? "Kosongkan jika tidak ingin mengubah password"
                    : "Masukkan password pengguna"
                }
                required={!editingUser} // required only on create
              />
              <InputField
                label="Konfirmasi Password"
                id="confirm_password"
                name="confirm_password"
                type="password"
                isPassword
                show={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword((s) => !s)}
                value={formData.confirm_password || ""}
                onChange={handleChange}
                placeholder={
                  editingUser
                    ? "Konfirmasi password baru"
                    : "Konfirmasi password pengguna"
                }
                required={!editingUser}
              />
            </>
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Peran
              </label>
              {isAdding && roleParam === "admin" ? (
                <>
                  <input type="hidden" name="role" value="admin" />
                  <div className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg">
                    Admin
                  </div>
                </>
              ) : isAdding && roleParam === "student" ? (
                <>
                  <input type="hidden" name="role" value="student" />
                  <div className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg">
                    Siswa
                  </div>
                </>
              ) : editingUser && formData.role === "student" ? (
                <>
                  <input type="hidden" name="role" value="student" />
                  <div className="w-full px-4 py-2 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg">
                    Siswa
                  </div>
                </>
              ) : (
                <select
                  id="role"
                  name="role"
                  value={formData.role || "student"}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="student">Siswa</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
            {showStudentFields && (
              <>
                <InputField
                  label="Kelas"
                  id="class"
                  name="class"
                  value={formData.class || ""}
                  onChange={handleChange}
                  placeholder="Masukkan kelas"
                />
                <InputField
                  label="Alamat"
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="Tambahkan alamat pengguna"
                />
                <InputField
                  label="No HP"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleChange}
                  placeholder="Masukkan nomor HP pengguna"
                />
                <InputField
                  label="NISN"
                  id="nisn"
                  name="nisn"
                  value={formData.nisn || ""}
                  onChange={handleChange}
                  placeholder="Masukkan NISN pengguna"
                />
              </>
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
                {editingUser ? "Simpan" : "Buat"}
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
          onClose={() =>
            setNotification({ isVisible: false, message: "", type: "success" })
          }
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default UsersPage;
