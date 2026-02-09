// components/DynamicNotification.js
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DynamicNotification = ({ message, type = 'success', isVisible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }, 7000); // Auto-hide after 7 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !show) {
    return null;
  }

  const bgColor = type === 'success' ? 'bg-white border border-green-200' :
                 type === 'error' ? 'bg-white border border-red-200' :
                 'bg-white border border-blue-200';
  const textColor = type === 'success' ? 'text-green-700' :
                   type === 'error' ? 'text-red-700' :
                   'text-blue-700';
  const iconColor = type === 'success' ? 'text-green-500' :
                    type === 'error' ? 'text-red-500' :
                    'text-blue-500';

  // Choose icon based on type
  const icon = type === 'success' ?
    <CheckCircleIcon className={`w-5 h-5 ${iconColor}`} /> :
    type === 'error' ?
    <ExclamationCircleIcon className={`w-5 h-5 ${iconColor}`} /> :
    <InformationCircleIcon className={`w-5 h-5 ${iconColor}`} />;

  return (
    <div className="fixed z-50 top-4 right-4">
      <div className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-out flex items-center space-x-2 max-w-sm ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-2'} backdrop-blur-sm`}>
        <div className="flex-shrink-0">
          {icon}
        </div>
        <span className="flex-grow text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className={`${iconColor} hover:opacity-70 focus:outline-none`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DynamicNotification;