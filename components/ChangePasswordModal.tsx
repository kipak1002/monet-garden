import React, { useState, useEffect, useRef } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: onUpdatePassword returns a Promise to handle async operations.
  onUpdatePassword: (currentAttempt: string, newPassword: string) => Promise<{ success: boolean, message: string }>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onUpdatePassword }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setIsUpdating(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // FIX: Make handleSubmit async to await the result of onUpdatePassword.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdating) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('모든 필드를 입력해야 합니다.');
      return;
    }
    if (newPassword.length !== 6) {
      setError('새 비밀번호는 6자리여야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await onUpdatePassword(currentPassword, newPassword);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setter(numericValue);
    if (error) setError('');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">비밀번호 변경</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isUpdating}>
            <div>
              <label className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
              <input
                ref={inputRef}
                type="password"
                value={currentPassword}
                onChange={handleNumericInputChange(setCurrentPassword)}
                maxLength={6}
                className={`w-full mt-1 p-2 border ${error.includes('Current') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${error.includes('Current') ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">새 6자리 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={handleNumericInputChange(setNewPassword)}
                maxLength={6}
                className={`w-full mt-1 p-2 border ${error && newPassword.length !== 6 ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${error && newPassword.length !== 6 ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                autoComplete="new-password"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={handleNumericInputChange(setConfirmPassword)}
                maxLength={6}
                className={`w-full mt-1 p-2 border ${error.includes('match') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 ${error.includes('match') ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                autoComplete="new-password"
                inputMode="numeric"
              />
            </div>
          </fieldset>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {isUpdating ? '업데이트 중...' : '비밀번호 변경'}
            </button>
            <button 
              type="button"
              onClick={onClose} 
              disabled={isUpdating}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-100"
            >
              취소
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

export default ChangePasswordModal;