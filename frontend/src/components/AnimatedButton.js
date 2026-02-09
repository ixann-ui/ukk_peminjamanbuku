import { motion } from 'framer-motion';

export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white focus:ring-red-500 shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white focus:ring-green-500 shadow-lg hover:shadow-xl',
    outline: 'bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-700/50 focus:ring-blue-500 shadow hover:shadow-lg'
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const buttonClasses = `${baseClasses} ${variants[variant]} ${disabledClass} ${className}`;

  if (disabled) {
    return (
      <button
        type={type}
        disabled={disabled}
        className={buttonClasses}
      >
        {children}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </motion.button>
  );
}