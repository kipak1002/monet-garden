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
}

const Gallery: React.FC<GalleryProps> = ({ artworks, onSelectArtwork, isAdminMode, onEditArtwork, onDeleteArtwork }) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [hasMoved, setHasMoved] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current || isAdminMode) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    
    // 드래그 중 텍스트 선택 방지
    document.body.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    
    // 드래그가 발생했다면 클릭 이벤트 전파 방지 (필요시)
    if (hasMoved) {
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // 스크롤 속도 조절
    
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleArtworkSelect = (artwork: Artwork) => {
    if (!hasMoved) {
      onSelectArtwork(artwork);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth * 0.6;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
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
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-4 rounded-full transition-all opacity-0 group-hover/gallery:opacity-100 border border-white/20"
            aria-label="이전 작품"
          >
            <Icon type="chevron-left" className="w-8 h-8" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white p-4 rounded-full transition-all opacity-0 group-hover/gallery:opacity-100 border border-white/20"
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
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className={`md:flex md:flex-row md:overflow-x-auto md:overflow-y-hidden md:h-[32rem] md:items-center md:gap-0 md:px-[10vw] flex flex-col gap-8 w-full ${isAdminMode ? 'custom-scrollbar' : 'scrollbar-hide'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {artworks.map((artwork, index) => (
          <ArtworkCard 
            key={artwork.id} 
            index={index}
            artwork={artwork} 
            onSelect={handleArtworkSelect}
            isAdminMode={isAdminMode}
            onEdit={onEditArtwork}
            onDelete={onDeleteArtwork}
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