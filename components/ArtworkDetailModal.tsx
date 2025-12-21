
import React, { useEffect, useState } from 'react';
import type { Artwork } from '../types';
import Icon from './Icon';
import Linkify from './Linkify';

interface ArtworkDetailModalProps {
  artwork: Artwork | null;
  onClose: () => void;
}

const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  artwork,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    setCurrentIndex(0); // Reset index when artwork changes

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [artwork, onClose]);

  if (!artwork) return null;

  const images = artwork.image_urls || [];
  const hasMultipleImages = images.length > 1;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

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
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-20 transition-colors"
          aria-label="닫기"
        >
          <Icon type="close" className="w-8 h-8" />
        </button>
        <div className="w-full md:w-2/3 h-96 md:h-auto bg-gray-100 relative flex items-center justify-center">
            {images.length > 0 ? (
                <img src={images[currentIndex]} alt={`${artwork.title} - Image ${currentIndex + 1}`} className="w-full h-full object-contain" />
            ) : (
                <div className='text-gray-500'>이미지가 없습니다.</div>
            )}
            {hasMultipleImages && (
              <>
                <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10" aria-label="이전 이미지">
                    <Icon type="chevron-left" className="w-6 h-6" />
                </button>
                <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10" aria-label="다음 이미지">
                    <Icon type="chevron-right" className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, slideIndex) => (
                        <div
                            key={slideIndex}
                            className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'}`}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(slideIndex); }}
                        />
                    ))}
                </div>
              </>
            )}
        </div>
        <div className="w-full md:w-1/3 p-6 md:p-8 flex flex-col overflow-y-auto">
          <h2 className="text-3xl font-bold text-gray-900">{artwork.title}</h2>
          <p className="text-lg text-gray-600 mt-1">{artwork.artist}, {artwork.year}</p>
          <p className="text-md text-gray-500 mt-2"><strong>크기:</strong> {artwork.size}</p>
          
          {artwork.memo && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-800">메모:</h4>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-md mt-1">
                <Linkify text={artwork.memo} />
              </p>
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
