// components/InputField.js
import { motion } from "framer-motion";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const InputField = ({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = "",
  // password toggle props
  isPassword = false,
  show = false,
  onToggleShow = null,
}) => {
  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <label
        htmlFor={id}
        className="block mb-1 text-sm font-medium text-foreground"
      >
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          id={id}
          name={name ?? id}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-2 pr-10 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition bg-background ${
            error ? "border-destructive" : ""
          } ${className}`}
          autoComplete={isPassword ? "new-password" : "off"}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute text-gray-500 -translate-y-1/2 right-2 top-1/2 hover:text-gray-700"
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? (
              <EyeIcon className="w-5 h-5" />
            ) : (
              <EyeSlashIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </motion.div>
  );
};

export default InputField;
