import React from 'react';
import Modal from './Modal'; // Your existing modal component

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${itemType}`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete {itemType.toLowerCase()}{' '}
          <span className="font-semibold">"{itemName}"</span>? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}