import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadImage, generateThumbnailFromUrl } from '../services/supabaseClient.ts';
import Spinner from './Spinner';
import Icon from './Icon';
import Linkify from './Linkify';

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
  const [profileInfo, setProfileInfo] = useState('');
  
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
  const [editProfileInfo, setEditProfileInfo] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0 });

  const adminMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['artistProfile', 'artistProfileInfo']);
        
        if (error) throw error;
        
        const settingsMap = new Map(data.map(s => [s.key, s.value]));

        // Handle Images
        const imageUrlsValue = settingsMap.get('artistProfile');
        if (imageUrlsValue) {
            try {
                const urls = JSON.parse(String(imageUrlsValue));
                if (Array.isArray(urls)) {
                    setProfileImageUrls(urls);
                    setEditImageUrls(urls);
                }
            } catch (e) {
                setProfileImageUrls([String(imageUrlsValue)]);
                setEditImageUrls([String(imageUrlsValue)]);
            }
        } else {
            setProfileImageUrls([]);
            setEditImageUrls([]);
        }

        const infoValue = settingsMap.get('artistProfileInfo') || '';
        setProfileInfo(String(infoValue));
        setEditProfileInfo(String(infoValue));

      } catch (error) {
        console.error('Error fetching profile data:', error);
        setProfileImageUrls([]);
        setProfileInfo('');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);
  
  useEffect(() => {
      if (!isAdminMode) {
          setEditImageUrls(profileImageUrls);
          setEditProfileInfo(profileInfo);
          setNewImageFiles([]);
          newImagePreviewUrls.forEach(URL.revokeObjectURL);
          setNewImagePreviewUrls([]);
      }
  }, [isAdminMode, profileImageUrls, profileInfo]);

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
      const files: File[] = Array.from(e.target.files);
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

      const saveImagesPromise = supabase
        .from('settings')
        .upsert({ key: 'artistProfile', value: JSON.stringify(finalImageUrls) }, { onConflict: 'key' });
      
      const saveInfoPromise = supabase
        .from('settings')
        .upsert({ key: 'artistProfileInfo', value: editProfileInfo }, { onConflict: 'key' });

      const [imagesResult, infoResult] = await Promise.all([saveImagesPromise, saveInfoPromise]);

      if (imagesResult.error) throw imagesResult.error;
      if (infoResult.error) throw infoResult.error;
      
      setProfileImageUrls(finalImageUrls);
      setEditImageUrls(finalImageUrls);
      setProfileInfo(editProfileInfo);
      
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

  const handleBatchGenerateThumbnails = async () => {
    if (!confirm('모든 기존 작품의 썸네일을 일괄 생성하시겠습니까? (이미지가 많을 경우 시간이 걸릴 수 있습니다.)')) return;
    
    setIsMigrating(true);
    try {
        const { data: artworks } = await supabase.from('artworks').select('image_urls');
        const { data: exhibitions } = await supabase.from('exhibitions').select('image_urls');
        const { data: imagination } = await supabase.from('imagination_gallery').select('original_image_url');

        const allUrls: string[] = [];
        artworks?.forEach(a => {
            const urls = typeof a.image_urls === 'string' ? JSON.parse(a.image_urls) : a.image_urls;
            if (Array.isArray(urls)) allUrls.push(...urls);
            else if (urls) allUrls.push(urls);
        });
        exhibitions?.forEach(e => {
            const urls = typeof e.image_urls === 'string' ? JSON.parse(e.image_urls) : e.image_urls;
            if (Array.isArray(urls)) allUrls.push(...urls);
            else if (urls) allUrls.push(urls);
        });
        imagination?.forEach(i => {
            if (i.original_image_url) allUrls.push(i.original_image_url);
        });

        const uniqueUrls = Array.from(new Set(allUrls)).filter(url => 
            url && url.includes('supabase.co') && url.endsWith('.webp') && !url.includes('_thumb.webp')
        );

        setMigrationProgress({ current: 0, total: uniqueUrls.length });

        let successCount = 0;
        for (let i = 0; i < uniqueUrls.length; i++) {
            const success = await generateThumbnailFromUrl(uniqueUrls[i]);
            if (success) successCount++;
            setMigrationProgress(prev => ({ ...prev, current: i + 1 }));
        }

        alert(`썸네일 생성 완료!\n대상: ${uniqueUrls.length}개 중 ${successCount}개 성공`);
    } catch (error) {
        console.error('Migration error:', error);
        alert('썸네일 일괄 생성 중 오류가 발생했습니다.');
    } finally {
        setIsMigrating(false);
        setMigrationProgress({ current: 0, total: 0 });
        setIsAdminMenuOpen(false);
    }
  };

  const renderAdminView = () => (
    <div className="max-w-7xl mx-auto divide-y divide-gray-200">
        <div className="py-6">
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

        <div className="py-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">CONTACT US</h3>
            <textarea
                value={editProfileInfo}
                onChange={(e) => setEditProfileInfo(e.target.value)}
                rows={5}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="인스타그램 링크, 이메일, 연락처 등 추가 정보를 입력하세요."
            />
        </div>

        <div className="pt-8 flex justify-end">
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
        {profileInfo && (
            <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="max-w-4xl">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">CONTACT US</h3>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-6 rounded-md">
                        <Linkify text={profileInfo} />
                    </div>
                </div>
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
                            <button
                                onClick={handleBatchGenerateThumbnails}
                                disabled={isMigrating}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 border-t"
                            >
                                <Icon type="sparkles" className="w-5 h-5 text-blue-500" />
                                <span>{isMigrating ? `진행중 (${migrationProgress.current}/${migrationProgress.total})` : '기존 그림 썸네일 일괄 생성'}</span>
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

      {isMigrating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
              <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
                  <Spinner size="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">썸네일 일괄 생성 중...</h3>
                  <p className="text-gray-600 mb-4">기존 이미지들을 최적화하고 있습니다.<br/>잠시만 기다려 주세요.</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
                        style={{ width: `${(migrationProgress.current / migrationProgress.total) * 100}%` }}
                      ></div>
                  </div>
                  <p className="text-sm font-medium text-blue-600">
                      {migrationProgress.current} / {migrationProgress.total} 처리 완료
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default ArtistProfilePage;
