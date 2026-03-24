
import React from 'react';
import { motion } from 'motion/react';
import type { ImaginationArtwork } from '../types';
import Icon from './Icon';

interface VideoArtworkCardProps {
  item: ImaginationArtwork;
  isAdminMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const VideoArtworkCard: React.FC<VideoArtworkCardProps> = ({ item, isAdminMode, onEdit, onDelete }) => {
  const [imgSrc, setImgSrc] = React.useState<string>('');

  const originalUrl = item.original_image_url;

  React.useEffect(() => {
    // 모바일 해상도를 위해 1280px 원본 이미지를 사용합니다.
    setImgSrc(originalUrl);
  }, [originalUrl]);

  const handleImageError = () => {
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
      variants={itemVariants}
      className="bg-white overflow-hidden flex flex-col group relative transition-all hover:shadow-2xl flex-shrink-0 md:w-[380px] md:h-[560px] w-full"
    >
      {isAdminMode && (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="bg-white text-gray-700 p-2 rounded-full shadow-md hover:bg-blue-500 hover:text-white transition-all"
            title="수정"
          >
            <Icon type="edit" className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-500 hover:text-white transition-all"
            title="삭제"
          >
            <Icon type="trash" className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Video Section - Top */}
      <div className="w-full h-[220px] md:h-[280px] bg-gray-950 flex items-center justify-center flex-shrink-0 relative">
        <video 
          src={item.video_url} 
          controls 
          loop
          muted
          playsInline
          className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-[1.03] transition-all duration-500 ease-out"
          poster={imgSrc}
        />
      </div>

      {/* Info Section - Bottom */}
      <div className="p-5 flex flex-col gap-3 bg-white flex-1">
        <div className="flex justify-between items-baseline">
          <h3 className="text-lg font-serif font-bold text-gray-900 tracking-tight whitespace-pre-wrap">{item.title}</h3>
          <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
            {item.year}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
            <img 
              src={imgSrc} 
              alt="원화 이미지" 
              onError={handleImageError}
              className="w-full h-full object-cover cursor-pointer brightness-90 hover:brightness-100 hover:scale-[1.03] transition-all duration-500 ease-out"
              onClick={() => window.open(originalUrl, '_blank')}
            />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-gray-400 italic font-serif">{item.size}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoArtworkCard;
