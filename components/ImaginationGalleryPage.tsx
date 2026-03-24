
import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { ImaginationArtwork } from '../types';
import Icon from './Icon';
import VideoArtworkCard from './VideoArtworkCard';
import AddImaginationModal from './AddImaginationModal';
import EditImaginationModal from './EditImaginationModal';

interface ImaginationGalleryPageProps {
  isAdminMode: boolean;
  imaginationArtworks: ImaginationArtwork[];
  onAddImagination: (title: string, size: string, year: number, videoFile: File, originalImage: File) => Promise<void>;
  onUpdateImagination: (id: number, title: string, size: string, year: number, videoFile?: File, originalImage?: File) => Promise<void>;
  onDeleteImagination: (item: ImaginationArtwork) => void;
}

const ImaginationGalleryPage: React.FC<ImaginationGalleryPageProps> = ({
  isAdminMode,
  imaginationArtworks,
  onAddImagination,
  onUpdateImagination,
  onDeleteImagination,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImaginationArtwork | null>(null);

  const handleEditClick = (item: ImaginationArtwork) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans pt-24 md:pt-32">
      <main className="relative group/gallery md:h-[30rem] md:flex md:items-center">
        {/* Navigation Buttons (Desktop Only) */}
        {!isAdminMode && (
          <>
            <button 
              onClick={() => {
                const container = document.querySelector('.imagination-scroll-container');
                container?.scrollBy({ left: -window.innerWidth * 0.6, behavior: 'smooth' });
              }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-gray-400/40 hover:bg-gray-500/60 backdrop-blur-md text-white p-4 rounded-full transition-all opacity-0 group-hover/gallery:opacity-100 border border-white/20"
            >
              <Icon type="chevron-left" className="w-8 h-8" />
            </button>
            <button 
              onClick={() => {
                const container = document.querySelector('.imagination-scroll-container');
                container?.scrollBy({ left: window.innerWidth * 0.6, behavior: 'smooth' });
              }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-gray-400/40 hover:bg-gray-500/60 backdrop-blur-md text-white p-4 rounded-full transition-all opacity-0 group-hover/gallery:opacity-100 border border-white/20"
            >
              <Icon type="chevron-right" className="w-8 h-8" />
            </button>
          </>
        )}

        <motion.div 
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
          className={`imagination-scroll-container md:flex md:flex-row md:overflow-x-auto md:overflow-y-hidden md:h-full md:items-center md:gap-12 md:px-[10vw] flex flex-col gap-8 w-full ${isAdminMode ? 'custom-scrollbar' : 'scrollbar-hide'}`}
        >
          {(imaginationArtworks && imaginationArtworks.length > 0) ? imaginationArtworks.map(item => (
            <VideoArtworkCard 
              key={item.id} 
              item={item} 
              isAdminMode={isAdminMode} 
              onEdit={() => handleEditClick(item)}
              onDelete={() => onDeleteImagination(item)} 
            />
          )) : (
            <div className="w-full text-center py-20">
              <h2 className="text-2xl font-semibold text-gray-700">작품이 없습니다.</h2>
              <p className="text-gray-500 mt-2">상상 속의 작품을 비디오와 함께 등록해보세요.</p>
            </div>
          )}
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
      </main>

      {isAdminMode && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
        >
          <Icon type="plus" className="w-8 h-8" />
        </button>
      )}

      <AddImaginationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={onAddImagination} 
      />

      <EditImaginationModal 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingItem(null); }}
        itemToEdit={editingItem}
        onUpdate={onUpdateImagination}
      />
    </div>
  );
};

export default ImaginationGalleryPage;
