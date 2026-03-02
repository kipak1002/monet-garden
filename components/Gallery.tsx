import React from 'react';
import type { Artwork } from '../types';
import ArtworkCard from './ArtworkCard';

interface GalleryProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  isAdminMode: boolean;
  onEditArtwork: (artwork: Artwork) => void;
  onDeleteArtwork: (artwork: Artwork) => void;
}

const Gallery: React.FC<GalleryProps> = ({ artworks, onSelectArtwork, isAdminMode, onEditArtwork, onDeleteArtwork }) => {
  if (artworks.length === 0) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-700">작품을 찾을 수 없습니다.</h2>
            <p className="text-gray-500 mt-2">검색어를 확인해주세요.</p>
        </div>
    )
  }
  
  return (
    <div className="md:flex md:flex-row md:overflow-x-auto md:overflow-y-hidden md:h-[60vh] md:items-center md:gap-12 md:px-20 md:my-[15vh] flex flex-col gap-16 p-4 custom-scrollbar">
      {artworks.map((artwork, index) => (
        <ArtworkCard 
          key={artwork.id} 
          index={index}
          artwork={artwork} 
          onSelect={onSelectArtwork}
          isAdminMode={isAdminMode}
          onEdit={onEditArtwork}
          onDelete={onDeleteArtwork}
        />
      ))}
    </div>
  );
};

export default Gallery;