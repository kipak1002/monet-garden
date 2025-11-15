import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient';
import Spinner from './Spinner';
import Icon from './Icon';

interface ArtistProfilePageProps {
  onNavigateHome: () => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenChangePasswordSettings: () => void;
}

const ArtistProfilePage: React.FC<ArtistProfilePageProps> = ({
  onNavigateHome,
  isAdminMode,
  onToggleAdminMode,
  onOpenChangePasswordSettings
}) => {
  const [profileImageUrls, setProfileImageUrls] = useState<string[]>([]);
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'artistProfile')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        const value = data?.value;
        if (value) {
            try {
                const urls = JSON.parse(value);
                if (Array.isArray(urls)) {
                    setProfileImageUrls(urls);
                    setEditImageUrls(urls);
                } else {
                    // Handle case where value is a single URL string for backward compatibility
                    setProfileImageUrls([value]);
                    setEditImageUrls([value]);
                }
            } catch (e) {
                // Handle non-JSON string value, likely a single URL from previous version
                setProfileImageUrls([value]);
                setEditImageUrls([value]);
            }
        } else {
            setProfileImageUrls([]);
            setEditImageUrls([]);
        }

      } catch (error) {
        console.error('Error fetching profile images:', error);
        setProfileImageUrls([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);
  
  useEffect(() => {
      if (!isAdminMode) {
          setEditImageUrls(profileImageUrls);
          setNewImageFiles([]);
          newImagePreviewUrls.forEach(URL.revokeObjectURL);
          setNewImagePreviewUrls([]);
      }
  }, [isAdminMode, profileImageUrls]);


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
      const previews = files.map(file => URL.createObjectURL(file));
      setNewImageFiles(prev => [...prev, ...files]);
      setNewImagePreviewUrls(prev => [...prev, ...previews]);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setEditImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleRemoveNewImage = (indexToRemove: number) => {
    URL.revokeObjectURL(newImagePreviewUrls[indexToRemove]);
    setNewImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setNewImagePreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const uploadPromises = newImageFiles.map(file => uploadImage(file));
      const newlyUploadedUrls = await Promise.all(uploadPromises);

      const finalImageUrls = [...editImageUrls, ...newlyUploadedUrls];

      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'artistProfile', value: JSON.stringify(finalImageUrls) }, { onConflict: 'key' });

      if (error) throw error;
      
      setProfileImageUrls(finalImageUrls);
      setEditImageUrls(finalImageUrls);
      newImagePreviewUrls.forEach(URL.revokeObjectURL);
      setNewImageFiles([]);
      setNewImagePreviewUrls([]);

      alert('프로필이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAdminView = () => (
    <div className="max-w-7xl mx-auto">
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">이미지 관리</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {editImageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group aspect-square">
                        <img src={url} alt={`Profile image ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-sm" />
                        <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="기존 이미지 삭제"
                        >
                            <Icon type="trash" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {newImagePreviewUrls.map((url, index) => (
                    <div key={url} className="relative group aspect-square">
                        <img src={url} alt={`New profile image ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-sm" />
                         <button
                            type="button"
                            onClick={() => handleRemoveNewImage(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="새 이미지 삭제"
                        >
                            <Icon type="trash" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    disabled={isSaving}
                >
                    <Icon type="plus" className="w-8 h-8"/>
                    <span className="text-sm mt-1">이미지 추가</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    multiple
                />
            </div>
        </div>
        <div className="mt-8 flex justify-end">
            <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="w-36 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center"
            >
            {isSaving ? <Spinner size="h-5 w-5" /> : '저장하기'}
            </button>
        </div>
    </div>
  );
  
  const renderPublicView = () => (
    <div className="max-w-7xl mx-auto">
        {profileImageUrls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {profileImageUrls.map((url, index) => (
                     <div key={index} className="aspect-w-1 aspect-h-1">
                        <img 
                            src={url} 
                            alt={`Profile image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg shadow-sm"
                        />
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-20 text-gray-500">
                <p>등록된 프로필 이미지가 없습니다.</p>
                <p className="text-sm mt-2">관리자 모드에서 이미지를 추가해주세요.</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            작가 프로필
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
      <main className="container mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="h-12 w-12" />
          </div>
        ) : isAdminMode ? renderAdminView() : renderPublicView()}
      </main>
    </div>
  );
};

export default ArtistProfilePage;
