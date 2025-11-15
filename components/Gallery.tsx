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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
      {artworks.map((artwork) => (
        <ArtworkCard 
          key={artwork.id} 
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