import React, { useEffect, useState } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset index when artwork changes
    setCurrentIndex(0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!artwork || !artwork.image_urls || artwork.image_urls.length <= 1) return;
      if (event.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev === 0 ? artwork.image_urls.length - 1 : prev - 1));
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev === artwork.image_urls.length - 1 ? 0 : prev + 1));
      }
    };
    
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [artwork, onClose]);

  if (!artwork) return null;
  
  const hasMultipleImages = artwork.image_urls && artwork.image_urls.length > 1;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? artwork.image_urls.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === artwork.image_urls.length - 1 ? 0 : prev + 1));
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  }

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
            {artwork.image_urls && artwork.image_urls.length > 0 ? (
                <>
                    <img src={artwork.image_urls[currentIndex]} alt={`${artwork.title} - 이미지 ${currentIndex + 1}`} className="w-full h-full object-contain" />
                    {hasMultipleImages && (
                        <>
                            <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
                                <Icon type="chevron-left" className="w-6 h-6"/>
                            </button>
                            <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
                                <Icon type="chevron-right" className="w-6 h-6"/>
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {artwork.image_urls.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        className={`w-3 h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                                        aria-label={`이미지 ${index + 1} 보기`}
                                    ></button>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className='text-gray-500'>이미지가 없습니다.</div>
            )}
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
