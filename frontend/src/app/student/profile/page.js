// app/student/profile/page.js
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import Card from "../../../components/Card";
import {
  UserIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  HomeIcon,
  IdentificationIcon,
  CameraIcon,
  XMarkIcon,
  PhotoIcon,
  ScissorsIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Cropper from "react-easy-crop";

const ProfilePage = () => {
  const { user, loading, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownElement = event.target.closest(".relative");
      if (
        dropdownElement &&
        !event.target.closest('[aria-haspopup="true"]') &&
        !event.target.closest(".relative > div")
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        setIsCropping(true); // Automatically open cropper when image is selected
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = async (imageSrc, crop) => {
    const image = new Image();
    image.src = imageSrc;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleSaveCroppedImage = async () => {
    if (!profileImage || !croppedAreaPixels) return;

    try {
      const croppedImageBlob = await getCroppedImg(
        previewUrl,
        croppedAreaPixels,
      );
      const formData = new FormData();
      formData.append("profile_image", croppedImageBlob, "profile.jpg");

      // Send the cropped image to the backend
      const response = await fetch(
        `http://localhost:5000/api/users/${user.id}/upload-profile-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();

      if (response.ok) {
        // Update the preview URL to show the new image
        setPreviewUrl(result.profileImageUrl);
        setIsCropping(false);
      } else {
        alert(result.message || "Gagal menyimpan gambar profil");
      }
    } catch (error) {
      console.error("Error saving cropped image:", error);
      alert("Terjadi kesalahan saat menyimpan gambar profil");
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    // Reset to original image if it was changed
    if (profileImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(profileImage);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="box-border w-full max-w-7xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center space-x-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="p-3 rounded-full bg-primary-100">
          <IdentificationIcon className="w-8 h-8 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
          <p className="text-gray-600">Informasi akun Anda</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Picture Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="h-full">
            <div className="flex flex-col items-center justify-center p-6 h-full">
              <div className="relative">
                <img
                  src={
                    previewUrl ||
                    (user.profile_picture
                      ? `http://localhost:5000${user.profile_picture}`
                      : user.profilePicture
                        ? `http://localhost:5000${user.profilePicture}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0D8ABC&color=fff`)
                  }
                  alt="Profile"
                  className="object-cover w-32 h-32 rounded-full border-3 border-primary-200"
                />
                <div className="absolute bottom-0 right-0">
                  {/* Dropdown menu for profile picture options */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="p-2 transition-colors rounded-full cursor-pointer bg-primary-600 hover:bg-primary-700"
                    >
                      <CameraIcon className="w-5 h-5 text-black translate-y-3.5 relative left-[2.5px]" />
                    </button>

                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 z-50 w-48 mt-2 origin-top-right bg-white border-gray-900 rounded-lg shadow-xl ring-1 ring-gray-600 ring-opacity-10"
                      >
                        <div className="py-1" role="none">
                          <label
                            className="flex items-center px-4 py-3 text-sm text-gray-900 transition-colors duration-150 cursor-pointer hover:bg-gray-50"
                            role="menuitem"
                          >
                            <PhotoIcon className="w-4 h-4 mr-3 text-primary-600" />
                            Pilih Foto Baru
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageChange}
                            />
                          </label>
                          <button
                            onClick={() => {
                              if (user.profile_picture || user.profilePicture) {
                                // If there's an existing profile picture, open crop modal
                                setPreviewUrl(
                                  user.profile_picture
                                    ? `http://localhost:5000${user.profile_picture}`
                                    : `http://localhost:5000${user.profilePicture}`,
                                );
                                setIsCropping(true);
                                setIsDropdownOpen(false);
                              } else {
                                alert(
                                  "Tidak ada foto profil untuk disesuaikan",
                                );
                              }
                            }}
                            className="flex items-center w-full px-4 py-3 text-sm text-left text-gray-900 transition-colors duration-150 hover:bg-gray-50"
                            role="menuitem"
                          >
                            <ScissorsIcon className="w-4 h-4 mr-3 text-primary-600" />
                            Sesuaikan Foto
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                {user.name || "N/A"}
              </h3>
              <p className="text-gray-600">{user.role === 'student' ? 'Siswa' : user.role || "Siswa"}</p>
            </div>
          </Card>
        </motion.div>

        {/* Personal Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <div className="p-6">
              <h2 className="mb-6 text-xl font-bold text-gray-800">
                Informasi Pribadi
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="w-5 h-5 mr-3 text-primary-600" />
                    <span>Nama Lengkap</span>
                  </div>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {user.name || user.user_name || "N/A"}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="w-5 h-5 mr-3 text-primary-600" />
                    <span>Alamat Email</span>
                  </div>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {user.email || user.user_email || "N/A"}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="w-5 h-5 mr-3 text-primary-600" />
                    <span>Kelas</span>
                  </div>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {user.class || user.user_class || user.user?.class || "N/A"}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <HomeIcon className="w-5 h-5 mr-3 text-primary-600" />
                    <span>Alamat</span>
                  </div>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {user.address ||
                      user.user_address ||
                      user.user?.address ||
                      "N/A"}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="w-5 h-5 mr-3 text-primary-600" />
                    <span>No HP</span>
                  </div>
                  <p className="mt-1 text-lg font-medium text-gray-900">
                    {user.phone_number || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Image Cropping Modal */}
      {isCropping && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent bg-opacity-75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Potong Gambar Profil
                </h3>
                <button
                  onClick={handleCancelCrop}
                  className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative w-full h-96">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="w-32">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelCrop}
                    className="px-4 py-2 text-sm font-medium text-white transition-colors bg-red-500 rounded-md hover:bg-red-700"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveCroppedImage}
                    className="px-4 py-2 text-sm font-medium text-white transition-colors bg-green-500 rounded-md hover:bg-green-700"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfilePage;
