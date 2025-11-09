import React, { useEffect } from 'react';
import Icon from './Icon';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  // FIX: Renamed 'artworkTitle' to 'itemNameToDelete' to make the component more generic.
  itemNameToDelete: string;
  // FIX: Added 'itemType' prop to specify what is being deleted (e.g., '작품' or '전시회').
  itemType: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, itemNameToDelete, itemType }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 md:p-8 relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">삭제 확인</h2>
        <p className="text-gray-600 mb-6">
          {/* FIX: Updated the confirmation message to be generic using itemNameToDelete and itemType. */}
          정말로 "<strong>{itemNameToDelete}</strong>" {itemType}을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>

        <div className="mt-6 flex justify-end gap-3">
           <button 
            onClick={onClose} 
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center justify-center bg-red-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors"
          >
            <Icon type="trash" className="w-5 h-5 mr-2"/>
            삭제
          </button>
        </div>
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

export default ConfirmDeleteModal;
