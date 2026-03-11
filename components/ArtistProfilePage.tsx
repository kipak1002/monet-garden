import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient.ts';
import Spinner from './Spinner';
import Icon from './Icon';
import Linkify from './Linkify';

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {profileImageUrls.map((url, index) => (
                    <div key={index} className="w-full">
                        <img 
                            src={url} 
                            alt={`Profile image ${index + 1}`}
                            className="w-full h-auto rounded-lg shadow-md"
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
                    <h3 className="text-2xl font-serif font-bold text-gray-800 mb-4">CONTACT US</h3>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed font-serif">
                        <Linkify text={profileInfo} />
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans pt-24 md:pt-32">
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
