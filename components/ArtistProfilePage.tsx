import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
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
  const [profileText, setProfileText] = useState('');
  const [editText, setEditText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'artistProfile')
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: 'exact one row was not found'
          throw error;
        }
        
        const text = data?.value || '작품 활동에 대한 소개, 연락처 등 자유롭게 프로필을 작성해주세요.';
        setProfileText(text);
        setEditText(text);

      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfileText('프로필을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);
  
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

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'artistProfile', value: editText }, { onConflict: 'key' });

      if (error) throw error;
      setProfileText(editText);
      alert('프로필이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

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
        ) : isAdminMode ? (
          <div className="max-w-4xl mx-auto">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-pre-wrap leading-relaxed"
              placeholder="프로필 내용을 입력하세요..."
              disabled={isSaving}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-36 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center"
              >
                {isSaving ? <Spinner size="h-5 w-5" /> : '저장하기'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-gray-50 p-6 md:p-8 rounded-lg shadow-sm">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {profileText}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtistProfilePage;