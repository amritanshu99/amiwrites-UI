export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-auto p-6 relative animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-red-600"
        >
          ✕
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}
