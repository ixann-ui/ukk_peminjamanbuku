// components/ConfirmationCheckbox.js
import { useState, useEffect } from 'react';

const ConfirmationCheckbox = ({ onConfirm, onCancel, message = "Apakah Anda yakin ingin melanjutkan?", confirmText = "Saya yakin", cancelText = "Batal" }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger the entrance animation when component mounts
    setIsVisible(true);
  }, []);

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Delay the actual cancellation to allow for the exit animation
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent bg-opacity-50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl transform transition-all duration-300 ease-in-out ${
          isVisible
            ? 'opacity-100 scale-100 translate-y-0 animate-modalSlideIn'
            : 'opacity-0 scale-95 translate-y-4 animate-fadeOut'
        }`}
      >
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Konfirmasi Aksi</h3>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">{message}</p>

          <div className="flex items-start mt-4">
            <div className="flex items-center h-5">
              <input
                id="confirm-checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="confirm-checkbox" className="font-medium text-gray-700">
                {confirmText}
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isChecked}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isChecked
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationCheckbox;