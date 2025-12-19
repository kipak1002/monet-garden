
import React, { useState, useRef } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';

interface LandingPageProps {
  onEnterGallery: () => void;
  onEnterProfile: () => void;
  onEnterExhibition: () => void;
  onEnterImagination: () => void;
  galleryTitle: string;
  subtitle?: string;
  backgroundImageUrl: string;
  isAdminMode: boolean;
  onUpdateBackground: (imageFile: File) => Promise<void>;
}

const DEFAULT_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1531973576160-712526b6a629?q=80&w=2080&auto=format&fit=crop";

const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnterGallery, 
  onEnterProfile, 
  onEnterExhibition,
  onEnterImagination,
  galleryTitle, 
  subtitle,
  backgroundImageUrl,
  isAdminMode,
  onUpdateBackground
}) => {
  const [newBg, setNewBg] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setNewBg({ file, previewUrl });
    }
  };

  const handleSave = async () => {
    if (!newBg) return;
    setIsSaving(true);
    try {
      await onUpdateBackground(newBg.file);
      URL.revokeObjectURL(newBg.previewUrl);
      setNewBg(null);
    } catch (error) {
      // Error is already alerted in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (newBg) {
      URL.revokeObjectURL(newBg.previewUrl);
    }
    setNewBg(null);
  };

  const currentBackgroundImage = newBg?.previewUrl || backgroundImageUrl || DEFAULT_BACKGROUND_IMAGE;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Background Image & Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentBackgroundImage}
          alt="Art gallery background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center transform transition-all duration-500 animate-slide-up-fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
          {galleryTitle}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto drop-shadow-sm">
            {subtitle}
          </p>
        )}
        <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onEnterProfile}>
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/20 transition-all duration-300 transform group-hover:scale-105">
                        <Icon type="profile" className="w-10 h-10 md:w-14 md:h-14 text-white transition-colors" />
                    </div>
                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors">작가 프로필</span>
                </div>
                <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onEnterExhibition}>
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/20 transition-all duration-300 transform group-hover:scale-105">
                        <Icon type="exhibition" className="w-10 h-10 md:w-14 md:h-14 text-white transition-colors" />
                    </div>
                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors">Exhibition</span>
                </div>
                <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onEnterImagination}>
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/20 transition-all duration-300 transform group-hover:scale-105">
                        <Icon type="video" className="w-10 h-10 md:w-14 md:h-14 text-white transition-colors" />
                    </div>
                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors">상상갤러리</span>
                </div>
            </div>
            <button
              onClick={onEnterGallery}
              className="mt-4 inline-flex items-center justify-center bg-white text-blue-700 font-bold py-3 px-10 rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              <Icon type="sparkles" className="w-6 h-6 mr-3" />
              갤러리 입장
            </button>
        </div>
      </div>
      
      {/* Admin Controls */}
      {isAdminMode && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
          />
          {!newBg && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-white/30 transition-all flex items-center gap-2"
              title="배경 이미지 변경"
            >
              <Icon type="edit" className="w-5 h-5" />
              <span>배경 변경</span>
            </button>
          )}

          {newBg && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-lg shadow-lg flex items-center gap-4 animate-slide-up-fade-in-slow">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-32 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center"
              >
                {isSaving ? <Spinner size="h-5 w-5" /> : '변경사항 저장'}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes slide-up-fade-in {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up-fade-in {
          animation: slide-up-fade-in 0.6s ease-out forwards;
        }
        @keyframes slide-up-fade-in-slow {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up-fade-in-slow {
          animation: slide-up-fade-in-slow 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
