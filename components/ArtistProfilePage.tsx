import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient.ts';
import Spinner from './Spinner';
import Icon from './Icon';

interface ArtistProfilePageProps {
  isAdminMode: boolean;
}

const ArtistProfilePage: React.FC<ArtistProfilePageProps> = ({
  isAdminMode,
}) => {
  const [profileImageUrls, setProfileImageUrls] = useState<string[]>([]);
  const [profileInfo, setProfileInfo] = useState('');
  
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
  const [editProfileInfo, setEditProfileInfo] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  
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
        
        const settingsMap = new Map((data || []).map(s => [s.key, s.value]));

        // Handle Images
        const imageUrlsValue = settingsMap.get('artistProfile');
        if (imageUrlsValue) {
          try {
            const urls = typeof imageUrlsValue === 'string' ? JSON.parse(imageUrlsValue) : imageUrlsValue;
            if (Array.isArray(urls)) {
              setProfileImageUrls(urls.filter(u => typeof u === 'string' && u.length > 0));
              setEditImageUrls(urls.filter(u => typeof u === 'string' && u.length > 0));
            } else if (typeof urls === 'string' && urls.trim()) {
              setProfileImageUrls([urls]);
              setEditImageUrls([urls]);
            }
          } catch (e) {
            if (typeof imageUrlsValue === 'string' && imageUrlsValue.trim()) {
              setProfileImageUrls([imageUrlsValue]);
              setEditImageUrls([imageUrlsValue]);
            }
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
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

      alert('작가 소개(사진 및 텍스트)가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAdminView = () => (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">About (작가 소개) 설정</h2>
          <p className="text-sm text-gray-500 mt-1">작가 소개 페이지에 들어갈 사진과 소개 텍스트를 함께 등록하고 수정할 수 있습니다.</p>
        </div>
      </div>

      {/* 1. 이미지 관리 섹션 */}
      <div className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Icon type="profile" className="w-5 h-5 text-gray-600" />
              <span>작가 사진 / 이미지 관리</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">작가 프로필 사진, 작업실 풍경, 작업 모습 등의 이미지를 여러 장 등록할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm flex items-center gap-1.5"
            disabled={isSaving}
          >
            <Icon type="plus" className="w-4 h-4" />
            <span>사진 추가</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
          {editImageUrls.map((url, index) => (
            <div key={`existing-${url}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img src={url} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveImageModal(url)}
                  className="p-1.5 bg-white/90 text-gray-800 rounded-full hover:bg-white transition-colors"
                  title="크게 보기"
                >
                  <Icon type="search" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="삭제"
                >
                  <Icon type="trash" className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                #{index + 1}
              </span>
            </div>
          ))}

          {newImagePreviewUrls.map((url, index) => (
            <div key={`new-${url}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-400 bg-white shadow-sm">
              <img src={url} alt={`New upload ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(index)}
                  className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="취소"
                >
                  <Icon type="trash" className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                NEW
              </span>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50/50 transition-all group"
            disabled={isSaving}
          >
            <div className="p-2.5 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
              <Icon type="upload" className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
            </div>
            <span className="text-xs font-medium mt-2 text-gray-600 group-hover:text-blue-600">사진 등록</span>
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

      {/* 2. 텍스트 / 소개글 작성 섹션 */}
      <div className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Icon type="edit" className="w-5 h-5 text-gray-600" />
            <span>작가 소개글 및 약력 텍스트</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            작가 소개, 작업 철학(작가 노트), 학력, 개인전/단체전 이력, 수상 경력 등을 자유롭게 입력하세요. 줄바꿈과 띄어쓰기가 그대로 화면에 표시됩니다.
          </p>
        </div>

        <div className="pt-1">
          <textarea
            value={editProfileInfo}
            onChange={(e) => setEditProfileInfo(e.target.value)}
            rows={14}
            placeholder={`[예시]\n김명진 (Kim Myeong-jin)\n\n[학력]\n홍익대학교 미술대학 회화과 졸업\n\n[주요 개인전]\n2024 초대전, 갤러리\n2022 개인전, 서울\n\n[작가 노트]\n빛과 공간, 자연의 조화를 캔버스에 담아내는 작업을 이어오고 있습니다...`}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-sans text-sm text-gray-800 leading-relaxed bg-white shadow-inner resize-y"
          />
        </div>
      </div>

      {/* 3. 저장 액션 */}
      <div className="pt-2 flex justify-end gap-3">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="px-8 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center gap-2 transition-all transform active:scale-95"
        >
          {isSaving ? (
            <>
              <Spinner size="h-5 w-5" />
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Icon type="check" className="w-4 h-4" />
              <span>작가 소개 저장하기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
  
  const renderPublicView = () => {
    const hasImages = profileImageUrls.length > 0;
    const hasText = Boolean(profileInfo && profileInfo.trim().length > 0);

    if (!hasImages && !hasText) {
      return (
        <div className="max-w-2xl mx-auto text-center py-28 text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
            <Icon type="profile" className="w-8 h-8" />
          </div>
          <p className="text-lg font-serif text-gray-600">작가 소개가 준비 중입니다.</p>
          <p className="text-xs text-gray-400 mt-2">관리자 모드에서 작가 사진과 소개글을 등록해주세요.</p>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
        <div className={`grid grid-cols-1 ${hasImages && hasText ? 'lg:grid-cols-12 gap-12 lg:gap-16 items-start' : 'gap-10'}`}>
          {/* 이미지 영역 */}
          {hasImages && (
            <div className={`${hasText ? 'lg:col-span-5' : 'max-w-3xl mx-auto w-full'} space-y-6`}>
              {/* 메인 프로필 이미지 */}
              <div 
                className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg cursor-pointer group"
                onClick={() => setActiveImageModal(profileImageUrls[0])}
              >
                <img 
                  src={profileImageUrls[0]} 
                  alt="작가 프로필" 
                  className="w-full h-auto max-h-[700px] object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-medium text-gray-900 shadow-md flex items-center gap-1">
                    <Icon type="search" className="w-3.5 h-3.5" />
                    <span>크게 보기</span>
                  </div>
                </div>
              </div>

              {/* 추가 이미지 썸네일 그리드 */}
              {profileImageUrls.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                  {profileImageUrls.slice(1).map((url, idx) => (
                    <div
                      key={`sub-img-${idx}`}
                      onClick={() => setActiveImageModal(url)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all group relative border border-gray-100"
                    >
                      <img 
                        src={url} 
                        alt={`작가 이미지 ${idx + 2}`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 텍스트 영역 */}
          {hasText && (
            <div className={`${hasImages ? 'lg:col-span-7' : 'max-w-3xl mx-auto w-full'} space-y-6`}>
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-800 text-[15px] sm:text-[16px] leading-[1.85] sm:leading-[1.95] whitespace-pre-wrap font-sans break-words selection:bg-blue-100">
                  {profileInfo}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans pt-28 md:pt-36 pb-20">
      <main className="container mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="h-12 w-12" />
          </div>
        ) : (
          isAdminMode ? renderAdminView() : renderPublicView()
        )}
      </main>

      {/* 이미지 확대 모달 */}
      {activeImageModal && (
        <div 
          className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 md:p-12 animate-fade-in"
          onClick={() => setActiveImageModal(null)}
        >
          <button
            onClick={() => setActiveImageModal(null)}
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/70 rounded-full transition-colors z-10"
            aria-label="닫기"
          >
            <Icon type="close" className="w-6 h-6" />
          </button>
          <div className="max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={activeImageModal} 
              alt="작가 사진 확대" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistProfilePage;

