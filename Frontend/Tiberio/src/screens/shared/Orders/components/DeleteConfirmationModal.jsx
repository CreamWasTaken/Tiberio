import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, order }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Delete Order</h2>
            <p className="text-sm text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-3">
            Are you sure you want to delete this order?
          </p>
          {order && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-white ml-2 font-semibold">#{order.id}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="text-white ml-2 font-semibold capitalize">{order.status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Supplier:</span>
                  <span className="text-white ml-2 font-semibold">{order.supplier_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white ml-2 font-semibold">₱{order.total_price?.toLocaleString()}</span>
                </div>
              </div>
              {order.receipt_number && (
                <div className="mt-2">
                  <span className="text-gray-400">Receipt:</span>
                  <span className="text-white ml-2 font-semibold">{order.receipt_number}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200 border border-gray-600 rounded-lg hover:border-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
