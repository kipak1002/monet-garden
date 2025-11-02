import React, { useEffect } from 'react';
import type { Artwork } from '../types';
import Icon from './Icon';

interface ArtworkDetailModalProps {
  artwork: Artwork | null;
  onClose: () => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  artwork,
  onClose,
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!artwork) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 transition-colors"
          aria-label="닫기"
        >
          <Icon type="close" className="w-8 h-8" />
        </button>
        <div className="w-full md:w-2/3 h-96 md:h-auto bg-gray-100">
          <img src={artwork.image_url} alt={artwork.title} className="w-full h-full object-contain" />
        </div>
        <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col overflow-y-auto">
          <h2 className="text-3xl font-bold text-gray-900">{artwork.title}</h2>
          <p className="text-lg text-gray-600 mt-1">{artwork.artist}, {artwork.year}</p>
          <p className="text-md text-gray-500 mt-2"><strong>크기:</strong> {artwork.size}</p>
          
          {artwork.memo && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-800">메모:</h4>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-md mt-1">{artwork.memo}</p>
            </div>
           )}
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

export default ArtworkDetailModal;