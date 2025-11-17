import React, { useState, useEffect, useRef } from 'react';
import type { Artwork } from '../types';
import Icon from './Icon';

interface ArtworkCardProps {
  artwork: Artwork;
  onSelect: (artwork: Artwork) => void;
  isAdminMode: boolean;
  onEdit: (artwork: Artwork) => void;
  onDelete: (artwork: Artwork) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onSelect, isAdminMode, onEdit, onDelete }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px 200px 0px', // Pre-load images 200px before they enter the viewport
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
  }, []);


  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(artwork);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(artwork);
  };

  const thumbnailUrl = artwork.image_urls && artwork.image_urls.length > 0 ? artwork.image_urls[0] : '';
  const hasMultipleImages = artwork.image_urls && artwork.image_urls.length > 1;

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-all duration-300 relative"
      onClick={() => onSelect(artwork)}
    >
      {hasMultipleImages && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/50 text-white text-xs rounded-full px-2 py-1 backdrop-blur-sm">
            <Icon type="collection" className="w-4 h-4" />
            <span>{artwork.image_urls.length}</span>
        </div>
      )}
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
      <div className="w-full h-64 bg-gray-200 overflow-hidden">
        {isIntersecting && thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={artwork.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 animate-fade-in"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 animate-pulse"></div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{artwork.title}</h3>
        <p className="text-sm text-gray-600">{artwork.artist}, {artwork.year}</p>
        <p className="text-sm text-gray-500 mt-1">{artwork.size}</p>
      </div>
    </div>
  );
};

export default ArtworkCard;