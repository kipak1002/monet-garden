import React, { useState, useRef, useEffect } from 'react';
import type { Exhibition } from '../types';
import Spinner from './Spinner';
import Icon from './Icon';

interface ExhibitionPageProps {
  onNavigateHome: () => void;
  isAdminMode: boolean;
  exhibitions: Exhibition[];
  onAddExhibition: (title: string, imageFile: File) => Promise<void>;
  onEditExhibition: (exhibition: Exhibition) => void;
  onDeleteExhibition: (exhibition: Exhibition) => void;
  isLoading: boolean;
  onToggleAdminMode: () => void;
  onOpenChangePasswordSettings: () => void;
}

const ExhibitionPage: React.FC<ExhibitionPageProps> = ({ 
  onNavigateHome, 
  isAdminMode,
  exhibitions,
  onAddExhibition,
  onEditExhibition,
  onDeleteExhibition,
  isLoading,
  onToggleAdminMode,
  onOpenChangePasswordSettings
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [newExhibition, setNewExhibition] = useState<{ title: string, image: File | null, previewUrl: string }>({ title: '', image: null, previewUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setNewExhibition(prev => ({ ...prev, image: file, previewUrl }));
    }
  };

  const handleAddExhibition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExhibition.title || !newExhibition.image) {
      alert('제목과 이미지 파일을 모두 선택해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      await onAddExhibition(newExhibition.title, newExhibition.image);
      setNewExhibition({ title: '', image: null, previewUrl: '' }); // Reset form
      if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error('Error adding exhibition:', error);
      alert('전시회 정보 추가 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Exhibitions
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              HOME
            </button>
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
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="h-12 w-12" />
          </div>
        ) : (
          <div>
            {isAdminMode && (
              <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">새 전시회 추가</h2>
                <form onSubmit={handleAddExhibition} className="space-y-4">
                  <div>
                    <label htmlFor="ex-title" className="block text-sm font-medium text-gray-700">전시회 제목</label>
                    <input
                      type="text"
                      id="ex-title"
                      value={newExhibition.title}
                      onChange={(e) => setNewExhibition(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">대표 이미지</label>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="w-32 h-32 rounded-md bg-gray-200 overflow-hidden flex-shrink-0">
                        {newExhibition.previewUrl ? (
                          <img src={newExhibition.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Icon type="upload" className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isUploading}
                      >
                        이미지 선택
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUploading || !newExhibition.title || !newExhibition.image}
                      className="w-32 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center"
                    >
                      {isUploading ? <Spinner size="h-5 w-5" /> : '추가하기'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="space-y-8">
              {exhibitions.length > 0 ? exhibitions.map(ex => (
                <div key={ex.id} className="bg-white rounded-lg shadow-md overflow-hidden group relative">
                   {isAdminMode && (
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                            onClick={() => onEditExhibition(ex)}
                            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-blue-500 hover:text-white transition-all"
                            aria-label="전시회 편집"
                            title="전시회 편집"
                        >
                            <Icon type="edit" className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => onDeleteExhibition(ex)}
                            className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-700 hover:bg-red-500 hover:text-white transition-all"
                            aria-label="전시회 삭제"
                            title="전시회 삭제"
                        >
                            <Icon type="trash" className="w-5 h-5" />
                        </button>
                    </div>
                  )}
                  <div className="w-full h-80 md:h-[30rem] lg:h-[40rem] bg-gray-200">
                    <img src={ex.image_url} alt={ex.title} className="w-full h-full object-contain" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800">{ex.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date(ex.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold text-gray-700">전시회가 없습니다.</h2>
                    <p className="text-gray-500 mt-2">관리자 모드에서 새 전시회를 추가해주세요.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExhibitionPage;
