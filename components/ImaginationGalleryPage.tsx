
import React, { useState } from 'react';
import type { ImaginationArtwork } from '../types';
import Spinner from './Spinner';
import Icon from './Icon';
import VideoArtworkCard from './VideoArtworkCard';
import AddImaginationModal from './AddImaginationModal';

interface ImaginationGalleryPageProps {
  onNavigateHome: () => void;
  isAdminMode: boolean;
  imaginationArtworks: ImaginationArtwork[];
  onAddImagination: (title: string, size: string, year: number, videoFile: File, originalImage: File) => Promise<void>;
  onDeleteImagination: (item: ImaginationArtwork) => void;
  onToggleAdminMode: () => void;
  onOpenChangePasswordSettings: () => void;
}

const ImaginationGalleryPage: React.FC<ImaginationGalleryPageProps> = ({
  onNavigateHome,
  isAdminMode,
  imaginationArtworks,
  onAddImagination,
  onDeleteImagination,
  onToggleAdminMode,
  onOpenChangePasswordSettings
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Icon type="video" className="w-8 h-8 text-blue-600" />
            상상갤러리
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={onNavigateHome} className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">HOME</button>
            {isAdminMode && (
                <div className="relative" ref={adminMenuRef}>
                    <button onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                        <Icon type="cog" className="w-6 h-6" />
                    </button>
                    {isAdminMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5">
                            <button onClick={() => { onOpenChangePasswordSettings(); setIsAdminMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                                <Icon type="key" className="w-5 h-5 text-gray-500" />
                                <span>관리자 비밀번호 변경</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            <button onClick={onToggleAdminMode} className={`p-2 rounded-full transition-colors duration-300 ${isAdminMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
              <Icon type="shield-check" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {imaginationArtworks.length > 0 ? imaginationArtworks.map(item => (
            <VideoArtworkCard 
              key={item.id} 
              item={item} 
              isAdminMode={isAdminMode} 
              onDelete={() => onDeleteImagination(item)} 
            />
          )) : (
            <div className="col-span-full text-center py-20">
              <h2 className="text-2xl font-semibold text-gray-700">작품이 없습니다.</h2>
              <p className="text-gray-500 mt-2">상상 속의 작품을 비디오와 함께 등록해보세요.</p>
            </div>
          )}
        </div>
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
    </div>
  );
};

export default ImaginationGalleryPage;
