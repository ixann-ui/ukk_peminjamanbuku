// components/Table.js
import { motion } from "framer-motion";

const Table = ({ columns, data, onRowClick, actions }) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-4 text-xs font-semibold tracking-wide text-left uppercase bg-transparent text-primary-800"
              >
                {column.header}
              </th>
            ))}
            {actions && (
              <th
                scope="col"
                className="px-6 py-4 text-xs font-semibold tracking-wide text-center uppercase bg-transparent text-primary-800"
              >
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                className={`hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 transition-all duration-200 ease-in-out ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-2 min-h-[36px]">
                      {actions.map((action, actionIndex) => {
                        // If an action provides a condition function, evaluate it with the row
                        if (
                          action.condition &&
                          typeof action.condition === "function"
                        ) {
                          try {
                            if (!action.condition(row)) return null;
                          } catch (err) {
                            // If condition throws, skip rendering this action for safety
                            return null;
                          }
                        }

                        const IconComponent = action.icon;
                        return (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={`flex items-center justify-center min-w-[70px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${action.className || "text-indigo-600 hover:text-indigo-900"}`}
                          >
                            {IconComponent ? (
                              <IconComponent className="inline w-4 h-4 mr-1" />
                            ) : null}
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))
          ) : (
            <motion.tr
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-12 text-sm text-center text-gray-500 bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <p className="mt-4 font-medium">Tidak ada data</p>
                  <p className="text-gray-500">
                    Data akan muncul di sini ketika tersedia
                  </p>
                </div>
              </td>
            </motion.tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
