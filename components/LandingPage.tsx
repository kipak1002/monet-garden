import React from 'react';
import Icon from './Icon';

interface LandingPageProps {
  onEnter: () => void;
  galleryTitle: string;
  subtitle?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, galleryTitle, subtitle }) => {
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
        <button
          onClick={onEnter}
          className="mt-8 inline-flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
        >
          <Icon type="sparkles" className="w-6 h-6 mr-3" />
          갤러리 입장
        </button>
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