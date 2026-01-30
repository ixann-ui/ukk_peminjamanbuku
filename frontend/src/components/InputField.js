// components/InputField.js
import { motion } from 'framer-motion';

const InputField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = ''
}) => {
  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition bg-background ${
          error ? 'border-destructive' : ''
        } ${className}`}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
      />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </motion.div>
  );
};

export default InputField;