import React, { useEffect } from 'react';
import type { Artwork } from '../types';
import Spinner from './Spinner';
import Icon from './Icon';

interface ArtworkDetailModalProps {
  artwork: Artwork | null;
  onClose: () => void;
  isGenerating: boolean;
  aiDescription: string | null;
  onGenerateDescription: () => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  artwork,
  onClose,
  isGenerating,
  aiDescription,
  onGenerateDescription,
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
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 transition-colors"
          aria-label="Close"
        >
          <Icon type="close" className="w-8 h-8" />
        </button>
        <div className="w-full md:w-1/2 h-64 md:h-auto">
          <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
        </div>
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <h2 className="text-3xl font-bold text-gray-900">{artwork.title}</h2>
          <p className="text-lg text-gray-600 mt-1">{artwork.artist}, {artwork.year}</p>
          <p className="text-md text-gray-500 mt-2"><strong>Size:</strong> {artwork.size}</p>
          <div className="mt-4 border-t pt-6 flex-grow">
            <h4 className="text-xl font-semibold text-gray-800 mb-3">AI Curator's Notes</h4>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Spinner size="h-12 w-12" />
                <p className="mt-4 text-gray-600 animate-pulse">Generating insights...</p>
              </div>
            ) : aiDescription ? (
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{aiDescription}</p>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                  <p className="text-gray-600 mb-4">Click the button to get an AI-powered analysis of this artwork.</p>
                  <button
                    onClick={onGenerateDescription}
                    disabled={isGenerating}
                    className="flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 transform hover:scale-105"
                  >
                    <Icon type="sparkles" className="w-5 h-5 mr-2"/>
                    Generate Description
                  </button>
              </div>
            )}
          </div>
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
