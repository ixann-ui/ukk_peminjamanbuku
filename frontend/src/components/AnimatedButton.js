// components/AnimatedButton.js
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const AnimatedButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  ...props 
}) => {
  // Define button styles based on variant
  const baseStyles = "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
 const variants = {
  primary:"bg-primary-600 hover:bg-primary-700 text-white focus:ring-2 focus:ring-primary-500 transition disabled:opacity-50",
  secondary:"bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-500 transition disabled:opacity-50",
  success:"bg-green-600 hover:bg-green-700 text-white focus:ring-2 focus:ring-green-500 transition disabled:opacity-50",
  danger:"bg-red-600 hover:bg-red-700 text-white focus:ring-2 focus:ring-red-500 transition disabled:opacity-50",
  outline:"border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 transition disabled:opacity-50",
};

  
  const sizes = {
    sm: "py-1 px-3 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
  };
  
  const combinedClasses = `flex items-center ${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={combinedClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
};

AnimatedButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};

export default AnimatedButton;