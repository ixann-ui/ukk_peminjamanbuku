// components/Card.js
import { motion } from 'framer-motion';

const Card = ({ title, children, className = '', headerActions = null }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.1
      }}
      whileHover={{
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      className={`bg-card rounded-xl shadow-md p-6 space-y-6 border border-border transition-all duration-300 hover:shadow-lg ${className}`}
    >
      {(title || headerActions) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex justify-between items-center pb-4 border-b border-border"
        >
          {title && <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>}
          {headerActions && <div className="flex items-center">{headerActions}</div>}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default Card;