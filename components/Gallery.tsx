import React from 'react';
import { motion } from 'motion/react';
import type { Artwork } from '../types';
import ArtworkCard from './ArtworkCard';
import Icon from './Icon';

interface GalleryProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  isAdminMode: boolean;
  onEditArtwork: (artwork: Artwork) => void;
  onDeleteArtwork: (artwork: Artwork) => void;
  onReorder: (items: Artwork[]) => void;
}

const Gallery: React.FC<GalleryProps> = ({ artworks, onSelectArtwork, isAdminMode, onEditArtwork, onDeleteArtwork, onReorder }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth * 0.6;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newItems = [...artworks];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, movedItem);
    onReorder(newItems);
  };

  if (artworks.length === 0) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-700">작품을 찾을 수 없습니다.</h2>
            <p className="text-gray-500 mt-2">검색어를 확인해주세요.</p>
        </div>
    )
  }
  
  return (
    <div className="relative group/gallery">
      {/* Navigation Buttons (Desktop Only) */}
      {!isAdminMode && (
        <>
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-gray-400/40 hover:bg-gray-500/60 backdrop-blur-md text-white p-4 rounded-full transition-all opacity-0 group-hover/gallery:opacity-100 border border-white/20"
            aria-label="이전 작품"
          >
            <Icon type="chevron-left" className="w-8 h-8" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-gray-400/40 hover:bg-gray-500/60 backdrop-blur-md text-white p-4 rounded-full transition-all opacity-0 group-hover/gallery:opacity-100 border border-white/20"
            aria-label="다음 작품"
          >
            <Icon type="chevron-right" className="w-8 h-8" />
          </button>
        </>
      )}

      <motion.div 
        ref={scrollContainerRef}
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className={`md:flex md:flex-row md:overflow-x-auto md:overflow-y-hidden md:h-[32rem] md:items-center md:gap-0 md:px-[10vw] flex flex-col gap-8 w-full ${isAdminMode ? 'custom-scrollbar' : 'scrollbar-hide'}`}
      >
        {artworks.map((artwork, index) => (
          <ArtworkCard 
            key={artwork.id} 
            index={index}
            artwork={artwork} 
            onSelect={onSelectArtwork}
            isAdminMode={isAdminMode}
            onEdit={onEditArtwork}
            onDelete={onDeleteArtwork}
            onMoveLeft={() => handleMove(index, 'left')}
            onMoveRight={() => handleMove(index, 'right')}
            isFirst={index === 0}
            isLast={index === artworks.length - 1}
          />
        ))}
      </motion.div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Gallery;