
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

type Page = 'landing' | 'gallery' | 'profile' | 'exhibition' | 'imagination';

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
  const [galleryTitle, setGalleryTitle] = useState('김명진 포트폴리오');
  const [adminPassword, setAdminPassword] = useState('');
  const [landingBackgroundUrl, setLandingBackgroundUrl] = useState('');
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<'작품' | '전시회' | '상상작품' | ''>('');
  
  // Exhibition Modals State
  const [isEditExhibitionModalOpen, setIsEditExhibitionModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);

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
      setGalleryTitle(String(settingsMap.get('galleryTitle') || '김명진 포트폴리오'));
      setAdminPassword(String(settingsMap.get('adminPassword') || '000000'));
      setLandingBackgroundUrl(String(settingsMap.get('landingBackgroundUrl') || ''));

      // 2. 우선 순위 페칭: 최신 작품 4개만 먼저 가져오기
      const { data: priorityArtworks, error: priorityError } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 3); // 0~3번 인덱스 (총 4개)

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
  
  const handleTitleChange = async (newTitle: string) => {
    setGalleryTitle(newTitle);
    try {
      await supabase.from('settings').upsert({ key: 'galleryTitle', value: newTitle }, { onConflict: 'key' });
    } catch (error) {
      console.error('Error updating title:', error);
      alert('제목 업데이트 중 오류가 발생했습니다.');
    }
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
    const { data, error } = await supabase.from('artworks').update({ ...updatedArtwork, image_urls: finalImageUrls }).eq('id', updatedArtwork.id).select().single();
    if (error) throw error;
    setArtworks(prev => prev.map(a => (a.id === updatedArtwork.id ? processArtwork(data) : a)));
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

  const handleAddImagination = async (title: string, size: string, year: number, videoFile: File, originalImage: File) => {
    const maxOrder = imaginationArtworks.length > 0 ? Math.max(...imaginationArtworks.map(i => i.display_order || 0)) : 0;
    const [videoUrl, imageUrl] = await Promise.all([uploadImage(videoFile), uploadImage(originalImage)]);
    const { data, error } = await supabase.from('imagination_gallery').insert([{ title, size, year, video_url: videoUrl, original_image_url: imageUrl, display_order: maxOrder + 1 }]).select().single();
    if (error) throw error;
    setImaginationArtworks(prev => [data, ...prev]);
  };

  const openEditModal = (artwork: Artwork) => { setEditingArtwork(artwork); setIsEditModalOpen(true); };
  const openAddModal = () => setIsAddModalOpen(true);
  const openDeleteModal = (item: any, type: '작품' | '전시회' | '상상작품') => { setItemToDelete(item); setItemTypeToDelete(type); };
  const closeDeleteModal = () => { setItemToDelete(null); setItemTypeToDelete(''); };

  if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><Spinner size="h-16 w-16" /></div>;

  const renderPage = () => {
    switch(currentPage) {
      case 'landing':
        return <LandingPage 
                  onEnterGallery={() => handleNavigate('gallery')} 
                  onEnterProfile={() => handleNavigate('profile')}
                  onEnterExhibition={() => handleNavigate('exhibition')}
                  onEnterImagination={() => handleNavigate('imagination')}
                  galleryTitle={galleryTitle}
                  backgroundImageUrl={landingBackgroundUrl}
                  isAdminMode={isAdminMode}
                  onUpdateBackground={handleUpdateLandingBackground}
                />;
      case 'profile':
        return <ArtistProfilePage 
                  onNavigateHome={() => handleNavigate('landing')} 
                  isAdminMode={isAdminMode} 
                  onToggleAdminMode={handleToggleAdminMode}
                  onOpenChangePasswordSettings={() => setIsChangePasswordModalOpen(true)}
                />;
      case 'exhibition':
        return <ExhibitionPage 
                  onNavigateHome={() => handleNavigate('landing')} 
                  isAdminMode={isAdminMode} 
                  exhibitions={exhibitions}
                  onAddExhibition={handleAddExhibition}
                  onEditExhibition={(ex) => {}} 
                  onDeleteExhibition={(ex) => openDeleteModal(ex, '전시회')}
                  isLoading={isLoading}
                  onToggleAdminMode={handleToggleAdminMode}
                  onOpenChangePasswordSettings={() => setIsChangePasswordModalOpen(true)}
                />;
      case 'imagination':
        return <ImaginationGalleryPage 
                  onNavigateHome={() => handleNavigate('landing')}
                  isAdminMode={isAdminMode}
                  imaginationArtworks={imaginationArtworks}
                  onAddImagination={handleAddImagination}
                  onDeleteImagination={(item) => openDeleteModal(item, '상상작품')}
                  onToggleAdminMode={handleToggleAdminMode}
                  onOpenChangePasswordSettings={() => setIsChangePasswordModalOpen(true)}
                />;
      case 'gallery':
      default:
        return (
          <>
            <Header
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              isAdminMode={isAdminMode}
              onToggleAdminMode={handleToggleAdminMode}
              galleryTitle={galleryTitle}
              onTitleChange={handleTitleChange}
              onOpenChangePasswordSettings={() => setIsChangePasswordModalOpen(true)}
              showHomeButton={true}
              onNavigateHome={() => handleNavigate('landing')}
              visitorCount={visitorCount}
            />
            <main className="container mx-auto">
              <Gallery 
                artworks={filteredArtworks}
                onSelectArtwork={handleSelectArtwork}
                isAdminMode={isAdminMode}
                onEditArtwork={openEditModal}
                onDeleteArtwork={(art) => openDeleteModal(art, '작품')}
              />
            </main>
            {isAdminMode && (
              <button
                  onClick={openAddModal}
                  title="새 작품 추가"
                  className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110"
              >
                  <Icon type="plus" className="w-8 h-8" />
              </button>
            )}
          </>
        );
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {renderPage()}
      <ArtworkDetailModal artwork={selectedArtwork} onClose={() => handleSelectArtwork(null)} />
      <EditArtworkModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} artworkToEdit={editingArtwork} onUpdate={handleUpdateArtwork} onDelete={(art) => { setIsEditModalOpen(false); openDeleteModal(art, '작품'); }} />
      <GenerateArtworkModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewArtwork} />
      <ConfirmDeleteModal isOpen={!!itemToDelete} onClose={closeDeleteModal} onConfirm={handleDeleteArtwork} itemNameToDelete={itemToDelete?.title || ''} itemType={itemTypeToDelete || ''} />
      <AdminPasswordModal isOpen={isPasswordPromptOpen} onClose={() => setIsPasswordPromptOpen(false)} onSubmit={handleAdminPasswordSubmit} />
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} onUpdatePassword={handleUpdatePassword} />
      <EditExhibitionModal isOpen={isEditExhibitionModalOpen} onClose={() => setIsEditExhibitionModalOpen(false)} exhibitionToEdit={editingExhibition} onUpdate={async (ex) => {}} />
    </div>
  );
};

export default App;
