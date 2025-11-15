import React from 'react';
import Icon from './Icon';

interface LandingPageProps {
  onEnterGallery: () => void;
  onEnterProfile: () => void;
  onEnterExhibition: () => void;
  galleryTitle: string;
  subtitle?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterGallery, onEnterProfile, onEnterExhibition, galleryTitle, subtitle }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="text-center transform transition-all duration-500 animate-slide-up-fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 tracking-tight">
          {galleryTitle}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        <div className="mt-12 flex flex-col items-center gap-10">
            <div className="flex justify-center gap-12">
                <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onEnterProfile}>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:bg-gray-50 transition-all duration-300 transform group-hover:scale-105">
                        <Icon type="profile" className="w-12 h-12 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">작가 프로필</span>
                </div>
                <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={onEnterExhibition}>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:bg-gray-50 transition-all duration-300 transform group-hover:scale-105">
                        <Icon type="exhibition" className="w-12 h-12 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">전시회</span>
                </div>
            </div>
            <button
              onClick={onEnterGallery}
              className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              <Icon type="sparkles" className="w-6 h-6 mr-3" />
              갤러리 입장
            </button>
        </div>
      </div>
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
      `}</style>
    </div>
  );
};

export default LandingPage;