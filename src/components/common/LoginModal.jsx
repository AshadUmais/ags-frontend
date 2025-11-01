import React from 'react';
import LoginPage from './LoginPage';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;

  // Add CSS animation for modal
  const modalAnimation = `
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;

  const handleLoginSuccess = (data) => {
    onLoginSuccess(data);
    onClose(); // Close modal after successful login
  };

  const handleBackdropClick = (e) => {
    // Close modal when clicking on backdrop (only the outer div, not the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <style>{modalAnimation}</style>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleBackdropClick}
      >
      <div 
        className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl transform transition-all duration-300 ease-out"
        style={{
          margin: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'modalFadeIn 0.3s ease-out'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200"
          style={{ zIndex: 10 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Login page content */}
        <div className="p-6">
          <LoginPage onLoginSuccess={handleLoginSuccess} isModal={true} />
        </div>
      </div>
      </div>
    </>
  );
};

export default LoginModal;