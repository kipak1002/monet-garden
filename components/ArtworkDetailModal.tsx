
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
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-0 md:p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* Fixed Close Button for Mobile */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-6 right-6 z-[100] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full transition-all border border-white/20 shadow-xl md:hidden"
        aria-label="닫기"
      >
        <Icon type="close" className="w-8 h-8" />
      </button>

      <div
        className="bg-white md:rounded-xl shadow-2xl w-full max-w-7xl h-full md:h-auto md:max-h-[92vh] flex flex-col md:flex-row overflow-hidden relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-6 right-6 text-gray-400 hover:text-gray-900 z-50 transition-all p-2 hover:bg-gray-100 rounded-full"
          aria-label="닫기"
        >
          <Icon type="close" className="w-8 h-8" />
        </button>

        <div className="w-full md:w-2/3 h-[55vh] md:h-auto bg-[#fdfdfd] md:bg-white relative flex items-center justify-center flex-shrink-0 p-4 md:p-0">
            {images.length > 0 ? (
                <img 
                  src={images[currentIndex]} 
                  alt={`${artwork.title} - Image ${currentIndex + 1}`} 
                  className="w-full h-full object-contain drop-shadow-md" 
                />
            ) : (
                <div className='text-gray-400 font-serif italic'>이미지가 없습니다.</div>
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
          <h2 className="text-3xl font-serif font-bold text-gray-900 whitespace-pre-wrap">{artwork.title}</h2>
          {artwork.title_en && (
            <p className="text-2xl font-serif text-gray-400 italic whitespace-pre-wrap -mt-1">{artwork.title_en}</p>
          )}
          <p className="text-lg text-gray-600 mt-1 font-serif italic">{artwork.artist}, {artwork.year}</p>
          <p className="text-md text-gray-500 mt-2 font-serif"><strong>크기:</strong> {artwork.size}</p>
          
          {artwork.memo && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-md font-serif font-semibold text-gray-800">메모:</h4>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mt-1 font-serif">
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
