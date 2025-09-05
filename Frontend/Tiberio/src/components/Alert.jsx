import React from 'react';

function Alert({ 
  isOpen, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  onConfirm, 
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) {
  if (!isOpen) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          headerBg: 'bg-gradient-to-r from-red-700 via-red-600 to-red-700',
          iconBg: 'bg-red-800',
          iconColor: 'text-red-200',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: (
            <svg className="w-5 h-5 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'warning':
        return {
          headerBg: 'bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700',
          iconBg: 'bg-yellow-800',
          iconColor: 'text-yellow-200',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          icon: (
            <svg className="w-5 h-5 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      case 'success':
        return {
          headerBg: 'bg-gradient-to-r from-green-700 via-green-600 to-green-700',
          iconBg: 'bg-green-800',
          iconColor: 'text-green-200',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          icon: (
            <svg className="w-5 h-5 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default: // info
        return {
          headerBg: 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700',
          iconBg: 'bg-blue-800',
          iconColor: 'text-blue-200',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          icon: (
            <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const styles = getAlertStyles();

  const handleBackdropClick = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleBackdropClick}></div>
      <div className="relative w-full max-w-md mx-4 shadow-2xl">
        <div className={`rounded-t-xl border border-gray-700 p-4 flex items-center gap-3 ${styles.headerBg}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-6">
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            {showCancel && (
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                onClick={handleCancel}
              >
                {cancelText}
              </button>
            )}
            <button
              className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${styles.buttonBg}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alert;
