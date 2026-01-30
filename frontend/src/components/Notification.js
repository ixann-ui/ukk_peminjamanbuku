// components/Notification.js
import { useEffect, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const Notification = ({ message, type = 'success', isVisible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }, 3000); // Auto-hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !show) {
    return null;
  }

  const bgColor = type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                 type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                 'bg-gradient-to-r from-blue-500 to-indigo-600';
  const textColor = 'text-white';
  const iconColor = 'text-white';

  // Choose icon based on type
  const icon = type === 'success' ?
    <CheckCircleIcon className={`w-6 h-6 ${iconColor}`} /> :
    type === 'error' ?
    <ExclamationCircleIcon className={`w-6 h-6 ${iconColor}`} /> :
    <InformationCircleIcon className={`w-6 h-6 ${iconColor}`} />;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className={`${bgColor} ${textColor} px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 ease-out ${show ? 'scale-100 opacity-100 translate-y-0 animate-fadeSlideIn' : 'scale-90 opacity-0 translate-y-10'} ${type === 'success' ? 'animate-notificationPulse' : ''} flex items-center space-x-3`}>
        {icon}
        <span className="font-medium text-lg">{message}</span>
      </div>
    </div>
  );
};

export default Notification;