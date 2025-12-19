
import React from 'react';
import type { ImaginationArtwork } from '../types';
import Icon from './Icon';

interface VideoArtworkCardProps {
  item: ImaginationArtwork;
  isAdminMode: boolean;
  onDelete: () => void;
}

const VideoArtworkCard: React.FC<VideoArtworkCardProps> = ({ item, isAdminMode, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group relative border border-gray-100 transition-all hover:shadow-2xl">
      {isAdminMode && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600"
            title="삭제"
          >
            <Icon type="trash" className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Video Section - Top */}
      <div className="w-full aspect-video bg-black flex items-center justify-center">
        <video 
          src={item.video_url} 
          controls 
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
          poster={item.original_image_url}
        />
      </div>

      {/* Info Section - Bottom */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">
            {item.year}년
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img 
              src={item.original_image_url} 
              alt="원화 이미지" 
              className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
              onClick={() => window.open(item.original_image_url, '_blank')}
            />
          </div>
          <div className="flex flex-col text-sm text-gray-600">
            <p><span className="font-semibold text-gray-900">크기:</span> {item.size}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoArtworkCard;
