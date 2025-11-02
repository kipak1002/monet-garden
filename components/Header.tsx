import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  galleryTitle: string;
  onTitleChange: (newTitle: string) => void;
  onOpenChangePasswordSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  searchTerm, 
  onSearchChange, 
  isAdminMode, 
  onToggleAdminMode,
  galleryTitle,
  onTitleChange,
  onOpenChangePasswordSettings
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(galleryTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTitleSave = () => {
    if (editableTitle.trim()) {
      onTitleChange(editableTitle.trim());
    } else {
        setEditableTitle(galleryTitle); // revert if empty
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditableTitle(galleryTitle);
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0 mr-4">
            {isEditingTitle ? (
                 <input
                    ref={titleInputRef}
                    type="text"
                    value={editableTitle}
                    onChange={(e) => setEditableTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleKeyDown}
                    className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                />
            ) : isAdminMode ? (
                <button
                    onClick={() => setIsEditingTitle(true)}
                    className="flex items-center gap-2 group"
                    title="갤러리 제목 편집"
                >
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">
                        {galleryTitle}
                    </h1>
                    <div className="text-gray-500 group-hover:text-blue-600 transition-colors">
                        <Icon type="edit" className="w-5 h-5" />
                    </div>
                </button>
            ) : (
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                    {galleryTitle}
                </h1>
            )}
        </div>
        <div className="flex items-center gap-4">
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="작품 검색..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon type="search" className="w-5 h-5" />
              </div>
            </div>
            {isAdminMode && (
                <div className="relative" ref={adminMenuRef}>
                    <button
                        onClick={() => setIsAdminMenuOpen(prev => !prev)}
                        title="관리자 설정"
                        className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                        aria-haspopup="true"
                        aria-expanded={isAdminMenuOpen}
                        aria-label="관리자 설정"
                    >
                        <Icon type="cog" className="w-6 h-6" />
                    </button>
                    {isAdminMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 ring-1 ring-black ring-opacity-5">
                            <button
                                onClick={() => {
                                    onOpenChangePasswordSettings();
                                    setIsAdminMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                            >
                                <Icon type="key" className="w-5 h-5 text-gray-500" />
                                <span>관리자 비밀번호 변경</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
            <button
              onClick={onToggleAdminMode}
              title={isAdminMode ? "관리자 모드 종료" : "관리자 모드 시작"}
              className={`p-2 rounded-full transition-colors duration-300 ${isAdminMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              <Icon type="shield-check" className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;