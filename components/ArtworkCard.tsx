import React from 'react';
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
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(artwork);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(artwork);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-all duration-300 relative"
      onClick={() => onSelect(artwork)}
    >
      {isAdminMode && (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={handleEditClick}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-blue-500 hover:text-white transition-all"
            aria-label="Edit Artwork"
            title="Edit Artwork"
          >
            <Icon type="edit" className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDeleteClick}
            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-red-500 hover:text-white transition-all"
            aria-label="Delete Artwork"
            title="Delete Artwork"
          >
            <Icon type="trash" className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
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
