
import React, { useState, useEffect, useCallback } from 'react';
import type { Artwork, Exhibition, ImaginationArtwork } from '../types';
import { supabase, uploadImage, recordVisit, getVisitorCount } from '../services/supabaseClient.ts';
import Header from './Header';
import Gallery from './Gallery';
import ArtworkDetailModal from './ArtworkDetailModal';
import Spinner from './Spinner';
import LandingPage from './LandingPage';
import EditArtworkModal from './EditArtworkModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import GenerateArtworkModal, { NewArtworkData } from './GenerateArtworkModal';
import Icon from './Icon';
import AdminPasswordModal from './AdminPasswordModal';
import ChangePasswordModal from './ChangePasswordModal';
import ArtistProfilePage from './ArtistProfilePage';
import ExhibitionPage from './ExhibitionPage';
import EditExhibitionModal from './EditExhibitionModal';
import ImaginationGalleryPage from './ImaginationGalleryPage';
import ContactPage from './ContactPage';
import AdminInquiryPage from './AdminInquiryPage';

type Page = 'landing' | 'gallery' | 'profile' | 'exhibition' | 'imagination' | 'contact' | 'admin-inquiry';

interface HistoryState {
  page: Page;
  selectedArtworkId?: number | null;
}

const parseImageUrls = (urls: unknown): string[] => {
  if (!urls) return [];
  let dataToParse: any = urls;
  if (Array.isArray(dataToParse)) {
    if (dataToParse.length === 1 && typeof dataToParse[0] === 'string') {
      dataToParse = dataToParse[0];
    } else {
      return dataToParse.filter((u): u is string => typeof u === 'string' && u.length > 0);
    }
  }
  if (typeof dataToParse !== 'string') return [];
  const str = dataToParse.trim();
  if (!str) return [];
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.filter((u): u is string => typeof u === 'string' && u.length > 0);
      }
    } catch (e) {}
  }
  if (str.startsWith('{') && str.endsWith('}')) {
    const content = str.substring(1, str.length - 1);
    return content.split(',').map(item => item.trim().replace(/^"|"$/g, '')).filter(Boolean);
  }
  return [str];
};

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [imaginationArtworks, setImaginationArtworks] = useState<ImaginationArtwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('김명진');
  const [adminPassword, setAdminPassword] = useState('');
  const [landingBackgroundUrl, setLandingBackgroundUrl] = useState('');
  const [artistKeywords, setArtistKeywords] = useState('');
  const [artistStatement, setArtistStatement] = useState('');
  const [galleryTitleFont, setGalleryTitleFont] = useState('Inter');
  const [galleryTitleSize, setGalleryTitleSize] = useState('24');
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<'작품' | '전시회' | '상상작품' | ''>('');
  
  // Exhibition Modals State
  const [isEditExhibitionModalOpen, setIsEditExhibitionModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);

  const [editTitle, setEditTitle] = useState(galleryTitle);
  const [editFont, setEditFont] = useState(galleryTitleFont);
  const [editSize, setEditSize] = useState(galleryTitleSize);

  useEffect(() => {
    setEditTitle(galleryTitle);
    setEditFont(galleryTitleFont);
    setEditSize(galleryTitleSize);
  }, [galleryTitle, galleryTitleFont, galleryTitleSize]);

  const FONT_OPTIONS = [
    { name: '기본 (Sans)', value: 'Inter, sans-serif' },
    { name: '세리프 (Serif)', value: 'Georgia, serif' },
    { name: '나눔명조', value: '"Nanum Myeongjo", serif' },
    { name: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
    { name: '바탕체', value: 'Batang, serif' },
    { name: '궁서체', value: 'Gungsuh, serif' },
  ];

  const processArtwork = (artwork: any): Artwork => ({
    ...artwork,
    image_urls: parseImageUrls(artwork.image_urls),
  });

  const processExhibition = (exhibition: any): Exhibition => ({
      ...exhibition,
      image_urls: parseImageUrls(exhibition.image_urls),
  });

  // Browser History Management
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as HistoryState;
      if (state) {
        setCurrentPage(state.page);
        if (state.selectedArtworkId) {
          const found = artworks.find(a => a.id === state.selectedArtworkId);
          setSelectedArtwork(found || null);
        } else {
          setSelectedArtwork(null);
        }
      } else {
        setCurrentPage('landing');
        setSelectedArtwork(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) {
      window.history.replaceState({ page: 'landing', selectedArtworkId: null }, '');
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [artworks]);

  const recordVisitOnMount = useCallback(() => {
    recordVisit();
  }, []);

  useEffect(() => {
    recordVisitOnMount();
  }, [recordVisitOnMount]);

  useEffect(() => {
    if (isAdminMode) {
      getVisitorCount().then(count => setVisitorCount(count));
    }
  }, [isAdminMode]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 기초 설정 데이터 페칭
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('key, value');
      if (settingsError) throw settingsError;
      
      const settingsMap = new Map(settingsData.map(s => [s.key, s.value]));
      setGalleryTitle(String(settingsMap.get('galleryTitle') || '김명진'));
      setAdminPassword(String(settingsMap.get('adminPassword') || '000000'));
      setLandingBackgroundUrl(String(settingsMap.get('landingBackgroundUrl') || ''));
      setArtistKeywords(String(settingsMap.get('artistKeywords') || ''));
      setArtistStatement(String(settingsMap.get('artistStatement') || ''));
      setGalleryTitleFont(String(settingsMap.get('galleryTitleFont') || 'Inter'));
      setGalleryTitleSize(String(settingsMap.get('galleryTitleSize') || '24'));

      // 2. 우선 순위 페칭: 최신 작품 3개만 먼저 가져오기
      const { data: priorityArtworks, error: priorityError } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 2); // 0~2번 인덱스 (총 3개)

      if (priorityError) throw priorityError;
      
      if (priorityArtworks) {
        const processedPriority = priorityArtworks.map(processArtwork);
        setArtworks(processedPriority);
        setFilteredArtworks(processedPriority);
      }

      // 전시회 및 상상갤러리 정보도 기초 로딩에 포함 (데이터 양이 적으므로)
      const { data: exhibitionsData } = await supabase.from('exhibitions').select('*').order('display_order', { ascending: false });
      if (exhibitionsData) setExhibitions((exhibitionsData || []).map(processExhibition));

      const { data: imaginationData } = await supabase.from('imagination_gallery').select('*').order('display_order', { ascending: false });
      if (imaginationData) setImaginationArtworks(imaginationData);

      // 여기까지 로딩되면 화면을 보여줌
      setIsLoading(false);

      // 3. 백그라운드 페칭: 나머지 전체 작품 데이터 가져오기
      const { data: allArtworks, error: allArtworksError } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!allArtworksError && allArtworks) {
        const processedAll = allArtworks.map(processArtwork);
        setArtworks(processedAll);
      }

    } catch (error) {
      console.error('Data fetch error:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const results = artworks.filter(artwork =>
      artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (artwork.title_en && artwork.title_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      artwork.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.year.toString().includes(searchTerm)
    );
    setFilteredArtworks(results);
  }, [searchTerm, artworks]);
  
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.history.pushState({ page, selectedArtworkId: null }, '');
  };

  const handleSelectArtwork = (artwork: Artwork | null) => {
    setSelectedArtwork(artwork);
    if (artwork) {
      window.history.pushState({ page: currentPage, selectedArtworkId: artwork.id }, '');
    } else {
      const state = window.history.state as HistoryState;
      if (state && state.selectedArtworkId) {
        window.history.back();
      }
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) setIsAdminMode(false);
    else setIsPasswordPromptOpen(true);
  };
  
  const handleAdminPasswordSubmit = (password: string) => {
    if (password === adminPassword) {
      setIsAdminMode(true);
      setIsPasswordPromptOpen(false);
      return true;
    }
    return false;
  };
  
  const handleUpdateLandingBackground = async (imageFile: File): Promise<void> => {
    try {
      const newUrl = await uploadImage(imageFile);
      const { error } = await supabase.from('settings').upsert({ key: 'landingBackgroundUrl', value: newUrl }, { onConflict: 'key' });
      if (error) throw error;
      setLandingBackgroundUrl(newUrl);
      alert('배경 이미지가 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('Error updating background:', error);
      alert('배경 이미지 업데이트 중 오류가 발생했습니다.');
      throw error;
    }
  };

  const handleUpdateArtistStatement = async (keywords: string, statement: string) => {
    try {
      const saveKeywords = supabase.from('settings').upsert({ key: 'artistKeywords', value: keywords }, { onConflict: 'key' });
      const saveStatement = supabase.from('settings').upsert({ key: 'artistStatement', value: statement }, { onConflict: 'key' });
      
      const [res1, res2] = await Promise.all([saveKeywords, saveStatement]);
      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;
      
      setArtistKeywords(keywords);
      setArtistStatement(statement);
      alert('작가 노트가 저장되었습니다.');
    } catch (error) {
      console.error('Error updating artist statement:', error);
      alert('작가 노트 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateGalleryTitleSettings = async (title: string, font: string, size: string) => {
    try {
      const saveTitle = supabase.from('settings').upsert({ key: 'galleryTitle', value: title }, { onConflict: 'key' });
      const saveFont = supabase.from('settings').upsert({ key: 'galleryTitleFont', value: font }, { onConflict: 'key' });
      const saveSize = supabase.from('settings').upsert({ key: 'galleryTitleSize', value: size }, { onConflict: 'key' });
      
      const [res1, res2, res3] = await Promise.all([saveTitle, saveFont, saveSize]);
      if (res1.error) throw res1.error;
      if (res2.error) throw res2.error;
      if (res3.error) throw res3.error;
      
      setGalleryTitle(title);
      setGalleryTitleFont(font);
      setGalleryTitleSize(size);
      alert('타이틀 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Error updating title settings:', error);
      alert('타이틀 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdatePassword = async (currentAttempt: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    if (currentAttempt !== adminPassword) return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    try {
      await supabase.from('settings').upsert({ key: 'adminPassword', value: newPassword }, { onConflict: 'key' });
      setAdminPassword(newPassword);
      setIsChangePasswordModalOpen(false);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      return { success: true, message: '성공' };
    } catch (error) {
      return { success: false, message: '비밀번호 업데이트 중 오류가 발생했습니다.' };
    }
  };

  const handleAddNewArtwork = async (newArtworkData: NewArtworkData) => {
    const uploadPromises = newArtworkData.images.map(imageFile => uploadImage(imageFile));
    const imageUrls = await Promise.all(uploadPromises);
    const { images, ...artworkDetails } = newArtworkData;
    const { data, error } = await supabase.from('artworks').insert([{ ...artworkDetails, image_urls: imageUrls }]).select().single();
    if (error) throw error;
    setArtworks(prev => [processArtwork(data), ...prev]);
    setIsAddModalOpen(false);
  };
  
  const handleUpdateArtwork = async (updatedArtwork: Artwork) => {
    const newImageDataUrls = updatedArtwork.image_urls.filter(url => url.startsWith('data:image'));
    const existingImageUrls = updatedArtwork.image_urls.filter(url => !url.startsWith('data:image'));
    const uploadPromises = newImageDataUrls.map(dataUrl => uploadImage(dataUrl));
    const newlyUploadedUrls = await Promise.all(uploadPromises);
    const finalImageUrls = [...existingImageUrls, ...newlyUploadedUrls];
    
    const { id, created_at, ...updateData } = updatedArtwork;
    const { data, error } = await supabase
        .from('artworks')
        .update({ ...updateData, image_urls: finalImageUrls })
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    setArtworks(prev => prev.map(a => (a.id === id ? processArtwork(data) : a)));
    setIsEditModalOpen(false);
  };

  const handleDeleteArtwork = async () => {
    if (!itemToDelete) return;
    let table = '';
    if (itemTypeToDelete === '작품') table = 'artworks';
    else if (itemTypeToDelete === '전시회') table = 'exhibitions';
    else if (itemTypeToDelete === '상상작품') table = 'imagination_gallery';
    
    const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
    if (error) alert("삭제 중 오류가 발생했습니다.");
    else {
        if (itemTypeToDelete === '작품') setArtworks(prev => prev.filter(a => a.id !== itemToDelete.id));
        else if (itemTypeToDelete === '전시회') setExhibitions(prev => prev.filter(e => e.id !== itemToDelete.id));
        else if (itemTypeToDelete === '상상작품') setImaginationArtworks(prev => prev.filter(i => i.id !== itemToDelete.id));
    }
    setItemToDelete(null);
    setItemTypeToDelete('');
  };

  const handleAddExhibition = async (title: string, description: string, imageFiles: File[]) => {
    const maxOrder = exhibitions.length > 0 ? Math.max(...exhibitions.map(e => e.display_order || 0)) : 0;
    const uploadPromises = imageFiles.map(file => uploadImage(file));
    const imageUrls = await Promise.all(uploadPromises);
    const { data, error } = await supabase.from('exhibitions').insert([{ title, description, image_urls: imageUrls, display_order: maxOrder + 1 }]).select().single();
    if (error) throw error;
    setExhibitions(prev => [processExhibition(data), ...prev]);
  };

  const handleUpdateExhibition = async (updatedExhibition: Exhibition) => {
    const newImageDataUrls = (updatedExhibition.image_urls || []).filter(url => url.startsWith('data:image'));
    const existingImageUrls = (updatedExhibition.image_urls || []).filter(url => !url.startsWith('data:image'));
    const uploadPromises = newImageDataUrls.map(dataUrl => uploadImage(dataUrl));
    const newlyUploadedUrls = await Promise.all(uploadPromises);
    const finalImageUrls = [...existingImageUrls, ...newlyUploadedUrls];
    
    const { id, created_at, ...updateData } = updatedExhibition;
    const { data, error } = await supabase
        .from('exhibitions')
        .update({ 
            ...updateData,
            image_urls: finalImageUrls 
        })
        .eq('id', id)
        .select()
        .single();
        
    if (error) throw error;
    setExhibitions(prev => prev.map(e => (e.id === id ? processExhibition(data) : e)));
    setIsEditExhibitionModalOpen(false);
  };

  const handleAddImagination = async (title: string, size: string, year: number, videoFile: File, originalImage: File) => {
    const maxOrder = imaginationArtworks.length > 0 ? Math.max(...imaginationArtworks.map(i => i.display_order || 0)) : 0;
    const [videoUrl, imageUrl] = await Promise.all([uploadImage(videoFile), uploadImage(originalImage)]);
    const { data, error } = await supabase.from('imagination_gallery').insert([{ title, size, year, video_url: videoUrl, original_image_url: imageUrl, display_order: maxOrder + 1 }]).select().single();
    if (error) throw error;
    setImaginationArtworks(prev => [data, ...prev]);
  };

  const handleUpdateImagination = async (id: number, title: string, size: string, year: number, videoFile?: File, originalImage?: File) => {
    const updates: any = { title, size, year };
    
    if (videoFile) {
        updates.video_url = await uploadImage(videoFile);
    }
    if (originalImage) {
        updates.original_image_url = await uploadImage(originalImage);
    }
    
    const { data, error } = await supabase.from('imagination_gallery').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setImaginationArtworks(prev => prev.map(i => (i.id === id ? data : i)));
  };

  const openEditModal = (artwork: Artwork) => { setEditingArtwork(artwork); setIsEditModalOpen(true); };
  const openEditExhibitionModal = (exhibition: Exhibition) => { setEditingExhibition(exhibition); setIsEditExhibitionModalOpen(true); };
  const openAddModal = () => setIsAddModalOpen(true);
  const openDeleteModal = (item: any, type: '작품' | '전시회' | '상상작품') => { setItemToDelete(item); setItemTypeToDelete(type); };
  const closeDeleteModal = () => { setItemToDelete(null); setItemTypeToDelete(''); };

  const renderPage = () => {
    switch(currentPage) {
      case 'landing':
        return <LandingPage 
                  backgroundImageUrl={landingBackgroundUrl}
                  artistKeywords={artistKeywords}
                  artistStatement={artistStatement}
                  isAdminMode={isAdminMode}
                  onUpdateBackground={handleUpdateLandingBackground}
                  onUpdateArtistStatement={handleUpdateArtistStatement}
                />;
      case 'profile':
        return <ArtistProfilePage 
                  isAdminMode={isAdminMode} 
                />;
      case 'exhibition':
        return <ExhibitionPage 
                  isAdminMode={isAdminMode} 
                  exhibitions={exhibitions}
                  onAddExhibition={handleAddExhibition}
                  onEditExhibition={openEditExhibitionModal} 
                  onDeleteExhibition={(ex) => openDeleteModal(ex, '전시회')}
                  isLoading={isLoading}
                />;
      case 'imagination':
        return <ImaginationGalleryPage 
                  isAdminMode={isAdminMode}
                  imaginationArtworks={imaginationArtworks}
                  onAddImagination={handleAddImagination}
                  onUpdateImagination={handleUpdateImagination}
                  onDeleteImagination={(item) => openDeleteModal(item, '상상작품')}
                />;
      case 'contact':
        return <ContactPage />;
      case 'admin-inquiry':
        return isAdminMode ? <AdminInquiryPage /> : <LandingPage 
                  backgroundImageUrl={landingBackgroundUrl}
                  artistKeywords={artistKeywords}
                  artistStatement={artistStatement}
                  isAdminMode={isAdminMode}
                  onUpdateBackground={handleUpdateLandingBackground}
                  onUpdateArtistStatement={handleUpdateArtistStatement}
                />;
      case 'gallery':
      default:
        return (
          <main className="w-full">
            <Gallery 
              artworks={filteredArtworks}
              onSelectArtwork={handleSelectArtwork}
              isAdminMode={isAdminMode}
              onEditArtwork={openEditModal}
              onDeleteArtwork={(art) => openDeleteModal(art, '작품')}
            />
          </main>
        );
    }
  }

  if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><Spinner size="h-16 w-16" /></div>;

  return (
    <div className="bg-white min-h-screen font-sans">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        galleryTitle={galleryTitle}
        galleryTitleFont={galleryTitleFont}
        galleryTitleSize={galleryTitleSize}
        onOpenChangePasswordSettings={() => setIsChangePasswordModalOpen(true)}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        visitorCount={visitorCount}
        onEditTitleSettings={() => setIsEditingTitle(true)}
      />
      
      {renderPage()}

      {/* Title Settings Modal */}
      {isEditingTitle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-up-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-6 font-serif">타이틀 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">문구</label>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">글자체</label>
                <select 
                  value={editFont}
                  onChange={(e) => setEditFont(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {FONT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">글자 크기 (px)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="12"
                    max="64"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold w-8">{editSize}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditingTitle(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={async () => {
                  await handleUpdateGalleryTitleSettings(editTitle, editFont, editSize);
                  setIsEditingTitle(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdminMode && currentPage === 'gallery' && (
        <button
            onClick={openAddModal}
            title="새 작품 추가"
            className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 z-50"
        >
            <Icon type="plus" className="w-8 h-8" />
        </button>
      )}
      <ArtworkDetailModal artwork={selectedArtwork} onClose={() => handleSelectArtwork(null)} />
      <EditArtworkModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} artworkToEdit={editingArtwork} onUpdate={handleUpdateArtwork} onDelete={(art) => { setIsEditModalOpen(false); openDeleteModal(art, '작품'); }} />
      <GenerateArtworkModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewArtwork} />
      <ConfirmDeleteModal isOpen={!!itemToDelete} onClose={closeDeleteModal} onConfirm={handleDeleteArtwork} itemNameToDelete={itemToDelete?.title || ''} itemType={itemTypeToDelete || ''} />
      <AdminPasswordModal isOpen={isPasswordPromptOpen} onClose={() => setIsPasswordPromptOpen(false)} onSubmit={handleAdminPasswordSubmit} />
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} onUpdatePassword={handleUpdatePassword} />
      <EditExhibitionModal isOpen={isEditExhibitionModalOpen} onClose={() => setIsEditExhibitionModalOpen(false)} exhibitionToEdit={editingExhibition} onUpdate={handleUpdateExhibition} />
    </div>
  );
};

export default App;
