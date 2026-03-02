
import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';

interface LandingPageProps {
  galleryTitle: string;
  galleryTitleFont: string;
  galleryTitleSize: string;
  subtitle?: string;
  backgroundImageUrl: string;
  artistKeywords: string;
  artistStatement: string;
  isAdminMode: boolean;
  onUpdateBackground: (imageFile: File) => Promise<void>;
  onUpdateArtistStatement: (keywords: string, statement: string) => Promise<void>;
  onNavigate: (page: 'landing' | 'gallery' | 'profile' | 'exhibition' | 'imagination') => void;
}

const DEFAULT_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1531973576160-712526b6a629?q=80&w=2080&auto=format&fit=crop";

const LandingPage: React.FC<LandingPageProps> = ({ 
  galleryTitle, 
  galleryTitleFont,
  galleryTitleSize,
  subtitle,
  backgroundImageUrl,
  artistKeywords,
  artistStatement,
  isAdminMode,
  onUpdateBackground,
  onUpdateArtistStatement,
  onNavigate,
}) => {
  const [newBg, setNewBg] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  
  const [editKeywords, setEditKeywords] = useState(artistKeywords);
  const [editStatement, setEditStatement] = useState(artistStatement);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditKeywords(artistKeywords);
    setEditStatement(artistStatement);
  }, [artistKeywords, artistStatement]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setNewBg({ file, previewUrl });
    }
  };

  const handleSaveBg = async () => {
    if (!newBg) return;
    setIsSaving(true);
    try {
      await onUpdateBackground(newBg.file);
      URL.revokeObjectURL(newBg.previewUrl);
      setNewBg(null);
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStatement = async () => {
    setIsSaving(true);
    try {
      await onUpdateArtistStatement(editKeywords, editStatement);
      setIsEditingStatement(false);
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBg = () => {
    if (newBg) {
      URL.revokeObjectURL(newBg.previewUrl);
    }
    setNewBg(null);
  };

  const scrollToStatement = () => {
    statementRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentBackgroundImage = newBg?.previewUrl || backgroundImageUrl || DEFAULT_BACKGROUND_IMAGE;

  return (
    <div className="relative min-h-screen w-full font-sans bg-black overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center p-4">
        {/* Background Image & Scrim */}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
          {/* Blurred background for PC to fill gaps without extreme zoom */}
          <img
            src={currentBackgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-50 hidden md:block"
            referrerPolicy="no-referrer"
          />
          {/* Main background image - object-cover on mobile, object-contain on PC for full view */}
          <img
            src={currentBackgroundImage}
            alt="Art gallery background"
            className="relative w-full h-full object-cover md:object-contain z-10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/30 z-20"></div>
        </div>

        {/* Content - Only visible on mobile or as a subtle title on PC if needed */}
        <div className="relative z-30 text-center transform transition-all duration-500 animate-slide-up-fade-in md:hidden">
          <h1 
            className="font-extrabold text-white tracking-tight drop-shadow-lg"
            style={{ 
              fontFamily: galleryTitleFont,
              fontSize: `${Math.min(Number(galleryTitleSize), 40)}px` // Limit size on mobile
            }}
          >
            {galleryTitle}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-200 max-w-2xl mx-auto drop-shadow-sm">
              {subtitle}
            </p>
          )}
          <div className="mt-12 flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center gap-6">
                  <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => onNavigate('profile')}>
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                          <Icon type="profile" className="w-10 h-10 text-white" />
                      </div>
                      <span className="font-medium text-gray-200">작가 프로필</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => onNavigate('exhibition')}>
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                          <Icon type="exhibition" className="w-10 h-10 text-white" />
                      </div>
                      <span className="font-medium text-gray-200">Exhibition</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 group cursor-pointer" onClick={() => onNavigate('imagination')}>
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-lg">
                          <Icon type="video" className="w-10 h-10 text-white" />
                      </div>
                      <span className="font-medium text-gray-200">상상갤러리</span>
                  </div>
              </div>
              <button
                onClick={() => onNavigate('gallery')}
                className="mt-4 inline-flex items-center justify-center bg-white text-blue-700 font-bold py-3 px-10 rounded-full shadow-lg"
              >
                <Icon type="sparkles" className="w-6 h-6 mr-3" />
                갤러리 입장
              </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 cursor-pointer animate-bounce"
          onClick={scrollToStatement}
        >
          <span className="text-white/60 text-[10px] font-bold tracking-[0.4em] uppercase">Artist Statement</span>
          <Icon type="chevron-down" className="w-5 h-5 text-white/60" />
        </div>

        {/* Admin Background Controls */}
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
                className="absolute bottom-6 right-6 z-40 bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-white/30 transition-all flex items-center gap-2"
                title="배경 이미지 변경"
              >
                <Icon type="edit" className="w-5 h-5" />
                <span>배경 변경</span>
              </button>
            )}

            {newBg && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/20 backdrop-blur-sm p-3 rounded-lg shadow-lg flex items-center gap-4 animate-slide-up-fade-in-slow">
                <button
                  onClick={handleCancelBg}
                  disabled={isSaving}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveBg}
                  disabled={isSaving}
                  className="w-32 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center"
                >
                  {isSaving ? <Spinner size="h-5 w-5" /> : '변경사항 저장'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Artist Statement Section */}
      <section 
        ref={statementRef}
        className="relative min-h-[50vh] bg-white text-gray-900 py-24 px-6 md:px-12"
      >
        <div className="max-w-4xl mx-auto">
          {isAdminMode && !isEditingStatement && (
            <div className="flex justify-end mb-8">
              <button 
                onClick={() => setIsEditingStatement(true)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Icon type="edit" className="w-4 h-4" />
                <span>작가 노트 수정</span>
              </button>
            </div>
          )}

          {isEditingStatement ? (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">키워드 (2~3줄)</label>
                <textarea 
                  value={editKeywords}
                  onChange={(e) => setEditKeywords(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  rows={3}
                  placeholder="작품을 관통하는 핵심 키워드들을 입력하세요."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">본문 (Artist Statement)</label>
                <textarea 
                  value={editStatement}
                  onChange={(e) => setEditStatement(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  rows={12}
                  placeholder="작가의 철학이나 작품에 대한 설명을 길게 작성하세요."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setIsEditingStatement(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleSaveStatement}
                  disabled={isSaving}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
                >
                  {isSaving ? <Spinner size="h-4 w-4" /> : '저장하기'}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-12">
                <h2 className="text-xs font-bold tracking-[0.3em] text-blue-600 uppercase mb-6">Artist Statement</h2>
                <div className="text-xl md:text-2xl font-serif font-medium text-gray-800 leading-relaxed whitespace-pre-wrap italic">
                  {artistKeywords || "작품의 핵심 키워드를 입력해주세요."}
                </div>
              </div>
              
              <div className="w-full h-px bg-gray-200 my-12"></div>
              
              <div className="text-lg text-gray-600 leading-loose whitespace-pre-wrap font-serif font-light">
                {artistStatement || "작가 노트를 작성해주세요."}
              </div>
            </div>
          )}
        </div>
      </section>

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
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
