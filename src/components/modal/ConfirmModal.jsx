import Modal from "./Modal";

const ConfirmModal = ({
  isOpen,
  closeModal,
  title,
  description,
  onConfirm,
  isLoading,
  confirmText = "Confirm",
  confirmColor = "blue",
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} closeModal={closeModal}>
      <div className="bg-white text-slate-900 dark:text-gray-100 dark:bg-gray-800 p-6 rounded shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm mb-4">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3 py-1 rounded text-sm text-white bg-${confirmColor}-600 hover:bg-${confirmColor}-700 disabled:opacity-50`}
          >
            {isLoading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
