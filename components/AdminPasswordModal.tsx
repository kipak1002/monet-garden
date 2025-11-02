import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => boolean;
}

const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Reset state and focus input when modal opens
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError('Password must be 6 digits.');
        return;
    }
    const success = onSubmit(password);
    if (!success) {
      setError('Incorrect password. Please try again.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 md:p-8 relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Admin Access</h2>
        <p className="text-gray-600 mb-6 text-center">Please enter the 6-digit password to continue.</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => {
              // Only allow numeric input
              const numericValue = e.target.value.replace(/[^0-9]/g, '');
              setPassword(numericValue);
              if (error) setError('');
            }}
            maxLength={6}
            className={`w-full text-center text-2xl tracking-[0.5em] p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            placeholder="●●●●●●"
            autoComplete="off"
            inputMode="numeric"
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              disabled={password.length !== 6}
            >
              Enter
            </button>
            <button 
              type="button"
              onClick={onClose} 
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminPasswordModal;
