import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  galleryTitle: string;
  galleryTitleFont: string;
  galleryTitleSize: string;
  onOpenChangePasswordSettings: () => void;
  onNavigate: (page: 'landing' | 'gallery' | 'profile' | 'exhibition' | 'imagination') => void;
  currentPage: string;
  visitorCount?: number | null;
  onEditTitleSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  searchTerm, 
  onSearchChange, 
  isAdminMode, 
  onToggleAdminMode,
  galleryTitle,
  galleryTitleFont,
  galleryTitleSize,
  onOpenChangePasswordSettings,
  onNavigate,
  currentPage,
  visitorCount,
  onEditTitleSettings
}) => {
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  const navItems = [
    { id: 'gallery', label: 'Gallery' },
    { id: 'exhibition', label: 'Exhibition' },
    { id: 'imagination', label: 'Imagination' },
    { id: 'profile', label: 'About' },
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-[60] transition-all duration-300 ${currentPage === 'landing' ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md shadow-sm'}`}>
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-6 md:py-8 flex justify-between items-center">
        {/* Left: Artist Name */}
        <div className="flex items-center gap-4">
          <h1 
            className={`cursor-pointer transition-colors ${currentPage === 'landing' ? 'text-white drop-shadow-md' : 'text-gray-900'}`}
            style={{ 
              fontFamily: galleryTitleFont, 
              fontSize: `${Math.min(Number(galleryTitleSize), 32)}px`,
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
            onClick={() => onNavigate('landing')}
          >
            {galleryTitle}
          </h1>
          {isAdminMode && onEditTitleSettings && (
            <button 
              onClick={onEditTitleSettings}
              className={`p-1 rounded-full transition-colors ${currentPage === 'landing' ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
              title="타이틀 설정"
            >
              <Icon type="edit" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Navigation & Controls */}
        <div className="flex items-center gap-6 md:gap-10">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as any)}
                className={`text-[11px] font-bold tracking-[0.3em] uppercase transition-all duration-300 hover:translate-y-[-2px] ${
                  currentPage === item.id 
                    ? (currentPage === 'landing' ? 'text-white border-b border-white' : 'text-blue-600 border-b border-blue-600')
                    : (currentPage === 'landing' ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-900')
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Search & Admin Controls */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Search Toggle */}
            <div className="relative flex items-center">
              {isSearchOpen && (
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  onBlur={() => !searchTerm && setIsSearchOpen(false)}
                  className={`absolute right-full mr-4 w-40 md:w-64 py-1.5 px-4 bg-white/10 backdrop-blur-md border rounded-full text-sm outline-none transition-all ${
                    currentPage === 'landing' ? 'border-white/30 text-white placeholder:text-white/50' : 'border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }`}
                />
              )}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 transition-colors ${currentPage === 'landing' ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Icon type="search" className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Menu */}
            {isAdminMode && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                  className={`p-2 rounded-full transition-colors ${currentPage === 'landing' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Icon type="cog" className="w-5 h-5" />
                </button>
                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-white rounded-xl shadow-2xl py-3 z-[70] ring-1 ring-black ring-opacity-5 animate-slide-up-fade-in-slow">
                    {visitorCount !== undefined && visitorCount !== null && (
                      <div className="px-5 py-2 text-xs text-gray-500 border-b border-gray-100 mb-2 flex justify-between items-center">
                        <span className="font-semibold uppercase tracking-wider">Visitors</span>
                        <span className="bg-blue-50 text-blue-700 py-0.5 px-2 rounded-full font-bold">{visitorCount.toLocaleString()}</span>
                      </div>
                    )}
                    <button
                      onClick={() => { onOpenChangePasswordSettings(); setIsAdminMenuOpen(false); }}
                      className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Icon type="key" className="w-4 h-4 text-gray-400" />
                      <span>비밀번호 변경</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin Toggle */}
            <button
              onClick={onToggleAdminMode}
              className={`p-2 rounded-full transition-all duration-300 ${
                isAdminMode 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : (currentPage === 'landing' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
              }`}
              title={isAdminMode ? "관리자 모드 종료" : "관리자 모드 시작"}
            >
              <Icon type="shield-check" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Rail (Bottom or simplified) */}
      <nav className="lg:hidden flex justify-around items-center py-4 px-2 border-t border-white/10 bg-black/20 backdrop-blur-lg md:hidden">
         {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${
                currentPage === item.id ? 'text-white' : 'text-white/50'
              }`}
            >
              {item.label}
            </button>
          ))}
      </nav>
    </header>
  );
};

export default Header;
