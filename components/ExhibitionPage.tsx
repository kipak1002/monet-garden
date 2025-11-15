import React, { useState, useRef, useEffect } from 'react';
import type { Exhibition } from '../types';
import Spinner from './Spinner';
import Icon from './Icon';

interface ExhibitionPageProps {
  onNavigateHome: () => void;
  isAdminMode: boolean;
  exhibitions: Exhibition[];
  onAddExhibition: (title: string, description: string, imageFiles: File[]) => Promise<void>;
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
  const [newExhibition, setNewExhibition] = useState<{ title: string, description: string, images: File[], previewUrls: string[] }>({ title: '', description: '', images: [], previewUrls: [] });
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
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const filePreviews = files.map(file => URL.createObjectURL(file));
      
      setNewExhibition(prev => ({
        ...prev,
        images: [...prev.images, ...files],
        previewUrls: [...prev.previewUrls, ...filePreviews],
      }));
    }
  };
  
  const removeNewImage = (indexToRemove: number) => {
    setNewExhibition(prev => {
        const updatedImages = prev.images.filter((_, index) => index !== indexToRemove);
        const updatedPreviewUrls = prev.previewUrls.filter((_, index) => index !== indexToRemove);
        
        // Clean up object URL to prevent memory leaks
        URL.revokeObjectURL(prev.previewUrls[indexToRemove]);

        return {
            ...prev,
            images: updatedImages,
            previewUrls: updatedPreviewUrls,
        };
    });
  }

  const handleAddExhibition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExhibition.title || !newExhibition.description || newExhibition.images.length === 0) {
      alert('제목, 정보, 그리고 하나 이상의 이미지 파일을 모두 선택해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      await onAddExhibition(newExhibition.title, newExhibition.description, newExhibition.images);
      
      // Clean up all object URLs
      newExhibition.previewUrls.forEach(url => URL.revokeObjectURL(url));

      setNewExhibition({ title: '', description: '', images: [], previewUrls: [] }); // Reset form
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
            전시회
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
                    <label htmlFor="ex-desc" className="block text-sm font-medium text-gray-700">전시회 정보</label>
                    <textarea
                      id="ex-desc"
                      value={newExhibition.description}
                      onChange={(e) => setNewExhibition(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="전시회에 대한 설명을 입력하세요."
                      required
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">대표 이미지</label>
                    <div className="mt-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            multiple
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={isUploading}
                        >
                            <Icon type="upload" className="w-5 h-5 mr-2 inline-block"/>
                            이미지 선택
                        </button>
                    </div>
                     {newExhibition.previewUrls.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {newExhibition.previewUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img src={url} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(index)}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Remove image"
                                    >
                                        <Icon type="close" className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isUploading || !newExhibition.title || newExhibition.images.length === 0}
                      className="w-32 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center"
                    >
                      {isUploading ? <Spinner size="h-5 w-5" /> : '추가하기'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="space-y-12">
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
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800">{ex.title}</h3>
                     {ex.description && (
                      <p className="mt-2 text-base text-gray-700 whitespace-pre-wrap">{ex.description}</p>
                    )}
                  </div>

                  {ex.image_urls && ex.image_urls.length > 0 ? (
                    <div className="w-full bg-gray-100 p-4">
                        <div className="flex overflow-x-auto space-x-4 py-2 custom-scrollbar snap-x snap-mandatory">
                            {ex.image_urls.map((url, index) => (
                                <div key={index} className="flex-shrink-0 w-4/5 md:w-auto snap-center">
                                    <img 
                                        src={url} 
                                        alt={`${ex.title} image ${index + 1}`} 
                                        className="h-80 md:h-[30rem] lg:h-[40rem] object-contain rounded-md" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                        이미지가 없습니다.
                    </div>
                  )}
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