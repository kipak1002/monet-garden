import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadImage } from '../services/supabaseClient';
import type { Exhibition } from '../types';
import Spinner from './Spinner';
import Icon from './Icon';

interface ExhibitionPageProps {
  onNavigateHome: () => void;
  isAdminMode: boolean;
}

const ExhibitionPage: React.FC<ExhibitionPageProps> = ({ onNavigateHome, isAdminMode }) => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newExhibition, setNewExhibition] = useState<{ title: string, image: File | null, previewUrl: string }>({ title: '', image: null, previewUrl: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchExhibitions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('exhibitions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setExhibitions(data as Exhibition[]);
      } catch (error) {
        console.error('Error fetching exhibitions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExhibitions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setNewExhibition(prev => ({ ...prev, image: file, previewUrl }));
    }
  };

  const handleAddExhibition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExhibition.title || !newExhibition.image) {
      alert('제목과 이미지 파일을 모두 선택해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(newExhibition.image);
      const { data, error } = await supabase
        .from('exhibitions')
        .insert({ title: newExhibition.title, image_url: imageUrl })
        .select()
        .single();
      
      if (error) throw error;
      setExhibitions([data as Exhibition, ...exhibitions]);
      setNewExhibition({ title: '', image: null, previewUrl: '' }); // Reset form
    } catch (error) {
      console.error('Error adding exhibition:', error);
      alert('전시회 정보 추가 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Exhibitions
          </h1>
          <button
            onClick={onNavigateHome}
            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            HOME
          </button>
        </div>
      </header>
      <main className="container mx-auto p-6 md:p-8">
        {isAdminMode && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4">새 전시회 추가</h2>
            <form onSubmit={handleAddExhibition} className="space-y-4">
              <div>
                <label htmlFor="ex-title" className="block text-sm font-medium text-gray-700">전시회 제목</label>
                <input
                  id="ex-title"
                  type="text"
                  value={newExhibition.title}
                  onChange={(e) => setNewExhibition(prev => ({...prev, title: e.target.value}))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="전시회 제목을 입력하세요"
                  disabled={isUploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">포스터 이미지</label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="w-32 h-32 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    {newExhibition.previewUrl ? (
                       <img src={newExhibition.previewUrl} alt="미리보기" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Icon type="upload" className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    파일 선택
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button type="submit" disabled={isUploading} className="w-36 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center">
                  {isUploading ? <Spinner size="h-5 w-5" /> : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="h-12 w-12" />
          </div>
        ) : exhibitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exhibitions.map((ex) => (
              <div key={ex.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="w-full h-80 bg-gray-200">
                  <img src={ex.image_url} alt={ex.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800">{ex.title}</h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700">등록된 전시회가 없습니다.</h2>
            {isAdminMode && <p className="text-gray-500 mt-2">관리자 모드에서 새 전시회를 추가해보세요.</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExhibitionPage;