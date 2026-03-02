import React, { useState, useEffect, useRef } from 'react';
import type { Artwork } from '../types';
import Icon from './Icon';

interface ArtworkCardProps {
  artwork: Artwork;
  index: number;
  onSelect: (artwork: Artwork) => void;
  isAdminMode: boolean;
  onEdit: (artwork: Artwork) => void;
  onDelete: (artwork: Artwork) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, index, onSelect, isAdminMode, onEdit, onDelete }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');

  // 썸네일 URL 생성 함수
  const getThumbnailUrl = (url: string) => {
    if (!url) return '';
    // Supabase 스토리지 URL이고 .webp 확장자인 경우 _thumb.webp 시도
    if (url.includes('supabase.co') && url.endsWith('.webp') && !url.includes('_thumb.webp')) {
      return url.replace('.webp', '_thumb.webp');
    }
    return url;
  };

  const originalUrl = artwork.image_urls && artwork.image_urls.length > 0 ? artwork.image_urls[0] : '';
  
  useEffect(() => {
    setImgSrc(getThumbnailUrl(originalUrl));
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

  return (
    <div
      ref={cardRef}
      className="bg-white overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-all duration-300 relative flex-shrink-0 md:h-full md:w-auto w-full flex flex-col"
      onClick={() => onSelect(artwork)}
    >
      {isAdminMode && (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
      <div className="flex-1 bg-white overflow-hidden md:h-full">
        {isIntersecting && imgSrc ? (
          <img
            src={imgSrc}
            alt={artwork.title}
            loading={index < 3 ? "eager" : "lazy"}
            onError={handleImageError}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 animate-fade-in"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 animate-pulse"></div>
        )}
      </div>
      <div className="p-4 bg-white">
        <h3 className="text-base font-serif font-bold text-gray-900 tracking-tight truncate">{artwork.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{artwork.artist}</p>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <p className="text-[10px] tracking-widest text-gray-500 font-medium">{artwork.year}</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 italic font-serif">{artwork.size}</p>
      </div>
    </div>
  );
};

export default ArtworkCard;