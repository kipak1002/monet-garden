import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { Artwork } from '../types';
import Icon from './Icon';

interface ArtworkCardProps {
  artwork: Artwork;
  index: number;
  onSelect: (artwork: Artwork) => void;
  isAdminMode: boolean;
  onEdit: (artwork: Artwork) => void;
  onDelete: (artwork: Artwork) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ 
  artwork, 
  index, 
  onSelect, 
  isAdminMode, 
  onEdit, 
  onDelete,
  onMoveLeft,
  onMoveRight,
  isFirst,
  isLast
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');

  const originalUrl = artwork.image_urls && artwork.image_urls.length > 0 ? artwork.image_urls[0] : '';
  
  useEffect(() => {
    // 모바일에서는 이미지가 화면 전체 너비를 차지하므로 400px 썸네일은 해상도가 떨어짐.
    // 1280px로 압축된 원본 이미지를 그대로 사용하는 것이 모바일 해상도에 적합함.
    setImgSrc(originalUrl);
  }, [originalUrl]);

  useEffect(() => {
    // 최신 3개 작품은 순차적으로 로딩 (0.4초 간격)
    if (index < 3) {
      const timer = setTimeout(() => {
        setIsIntersecting(true);
      }, index * 400);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px 200px 0px',
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [index]);


  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(artwork);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(artwork);
  };

  const handleImageError = () => {
    // 썸네일 로드 실패 시 원본으로 폴백
    if (imgSrc !== originalUrl) {
      setImgSrc(originalUrl);
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      className="bg-white overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-all duration-300 relative flex-shrink-0 md:h-full md:w-auto w-full flex flex-col"
      onClick={() => onSelect(artwork)}
    >
      {isAdminMode && (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            {!isFirst && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveLeft(); }}
                className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-blue-500 hover:text-white transition-all"
                aria-label="왼쪽으로 이동"
                title="왼쪽으로 이동"
              >
                <Icon type="chevron-left" className="w-5 h-5" />
              </button>
            )}
            {!isLast && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveRight(); }}
                className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-blue-500 hover:text-white transition-all"
                aria-label="오른쪽으로 이동"
                title="오른쪽으로 이동"
              >
                <Icon type="chevron-right" className="w-5 h-5" />
              </button>
            )}
          </div>
          <button 
            onClick={handleEditClick}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-blue-500 hover:text-white transition-all"
            aria-label="작품 편집"
            title="작품 편집"
          >
            <Icon type="edit" className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteClick}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-red-500 hover:text-white transition-all"
            aria-label="작품 삭제"
            title="작품 삭제"
          >
            <Icon type="trash" className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="relative bg-white overflow-hidden md:h-full aspect-[3/4] md:aspect-auto flex-shrink-0">
        {isIntersecting && imgSrc ? (
          <img
            src={imgSrc}
            alt={artwork.title}
            loading={index < 3 ? "eager" : "lazy"}
            onError={handleImageError}
            className="w-full h-full object-contain brightness-95 group-hover:brightness-100 transition-all duration-500 ease-out animate-fade-in"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 animate-pulse"></div>
        )}
      </div>
      <div className="p-4 bg-white">
        <h3 className="text-base font-serif font-bold text-gray-900 tracking-tight whitespace-pre-wrap">{artwork.title}</h3>
        {artwork.title_en && (
          <p className="text-sm text-gray-400 font-serif italic whitespace-pre-wrap -mt-0.5">{artwork.title_en}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{artwork.artist}</p>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <p className="text-[10px] tracking-widest text-gray-500 font-medium">{artwork.year}</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 italic font-serif">{artwork.size}</p>
        {artwork.memo && (
          <p className="text-[10px] text-gray-400 mt-1 font-serif line-clamp-1">{artwork.memo}</p>
        )}
      </div>
    </motion.div>
  );
};

export default ArtworkCard;