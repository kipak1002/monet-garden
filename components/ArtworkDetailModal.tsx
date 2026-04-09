
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
      className="fixed inset-0 bg-[#000000]/98 flex items-center justify-center z-[99999] p-0 md:p-12 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      {/* EXTREME Close Button - Fixed to viewport corner, huge, and highest z-index */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed top-4 right-4 z-[100000] bg-white text-black p-5 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-90 transition-all border-4 border-black"
        aria-label="닫기"
      >
        <Icon type="close" className="w-8 h-8 md:w-10 md:h-10" />
      </button>

      <div
        className="bg-white md:rounded-[3rem] shadow-2xl w-full max-w-7xl h-full md:h-auto md:max-h-[85vh] flex flex-col md:flex-row overflow-hidden relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full md:w-2/3 h-[45vh] sm:h-[50vh] md:h-[70vh] bg-[#f0f0f0] relative flex items-center justify-center p-8 md:p-20">
            {images.length > 0 ? (
                <img 
                  src={images[currentIndex]} 
                  alt={`${artwork.title} - Image ${currentIndex + 1}`} 
                  className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.2)] select-none" 
                  referrerPolicy="no-referrer"
                />
            ) : (
                <div className='text-gray-400 font-serif italic'>이미지가 없습니다.</div>
            )}
            {/* Version marker for cache check */}
            <div className="absolute bottom-2 right-2 text-[8px] text-gray-300 opacity-20">v1.2.3-fold-fix</div>
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
