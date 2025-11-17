import React, { useState, useEffect, useCallback } from 'react';
import type { Artwork, Exhibition } from '../types';
import { supabase, uploadImage } from '../services/supabaseClient.ts';
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

type Page = 'landing' | 'gallery' | 'profile' | 'exhibition';

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
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

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Artwork | Exhibition | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<'작품' | '전시회' | ''>('');
  
  // Exhibition Modals State
  const [isEditExhibitionModalOpen, setIsEditExhibitionModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase.from('settings').select('key, value');
      if (settingsError) throw settingsError;
      
      const settingsMap = new Map(settingsData.map(s => [s.key, s.value]));
      setGalleryTitle(String(settingsMap.get('galleryTitle') || '김명진 포트폴리오'));
      setAdminPassword(String(settingsMap.get('adminPassword') || '000000'));
      setLandingBackgroundUrl(String(settingsMap.get('landingBackgroundUrl') || ''));

      // Fetch artworks
      const { data: artworksData, error: artworksError } = await supabase.from('artworks').select('*').order('created_at', { ascending: false });
      if (artworksError) throw artworksError;
      
      const processedArtworks = (artworksData || []).map(artwork => {
        if (artwork.image_urls && typeof artwork.image_urls === 'string') {
          const urlsString = artwork.image_urls.replace(/^{|}$/g, '');
          return {
            ...artwork,
            image_urls: urlsString.split(',').filter((url: string) => url.trim() !== '')
          };
        }
        return artwork;
      });
      setArtworks(processedArtworks as Artwork[]);
      setFilteredArtworks(processedArtworks as Artwork[]);

      // Fetch exhibitions
      const { data: exhibitionsData, error: exhibitionsError } = await supabase.from('exhibitions').select('*').order('display_order', { ascending: false });
      if (exhibitionsError) {
        if (exhibitionsError.code === '42P01') { 
          console.warn('Exhibitions table not found. Please create it in Supabase if you need this feature.');
        } else {
          throw exhibitionsError;
        }
      }
      if (exhibitionsData) {
        setExhibitions(exhibitionsData as Exhibition[]);
      }

    } catch (error) {
      console.error('An unexpected error occurred during initial data fetch:', error);
    } finally {
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
  
  // Page Navigation Handlers
  const handleNavigate = (page: Page) => setCurrentPage(page);

  // Admin Mode Handlers
  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setIsPasswordPromptOpen(true);
    }
  };
  
  const handleAdminPasswordSubmit = (password: string) => {
    if (password === adminPassword) {
      setIsAdminMode(true);
      setIsPasswordPromptOpen(false);
      return true;
    }
    return false;
  };
  
  // Settings Handlers
  const handleTitleChange = async (newTitle: string) => {
    setGalleryTitle(newTitle);
    try {
      await supabase
        .from('settings')
        .upsert({ key: 'galleryTitle', value: newTitle }, { onConflict: 'key' });
    } catch (error) {
      console.error('Error updating title:', error);
      alert('제목 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateLandingBackground = async (imageFile: File): Promise<void> => {
    try {
      const newUrl = await uploadImage(imageFile);
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'landingBackgroundUrl', value: newUrl }, { onConflict: 'key' });
      
      if (error) throw error;
      
      setLandingBackgroundUrl(newUrl);
      alert('배경 이미지가 성공적으로 변경되었습니다.');
    } catch (error) {
      console.error('Error updating background image:', error);
      alert('배경 이미지 업데이트 중 오류가 발생했습니다.');
      throw error;
    }
  };

  const handleUpdatePassword = async (currentAttempt: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    if (currentAttempt !== adminPassword) {
      return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    }
    try {
      await supabase
        .from('settings')
        .upsert({ key: 'adminPassword', value: newPassword }, { onConflict: 'key' });
      setAdminPassword(newPassword);
      setIsChangePasswordModalOpen(false);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      return { success: true, message: '성공' };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, message: '비밀번호 업데이트 중 오류가 발생했습니다.' };
    }
  };

  // Artwork CRUD Handlers
  const handleAddNewArtwork = async (newArtworkData: NewArtworkData) => {
    const uploadPromises = newArtworkData.images.map(imageFile => uploadImage(imageFile));
    const imageUrls = await Promise.all(uploadPromises);

    const { images, ...artworkDetails } = newArtworkData;

    const { data, error } = await supabase
      .from('artworks')
      .insert([{ ...artworkDetails, image_urls: imageUrls }])
      .select()
      .single();
    if (error) throw error;
    setArtworks(prev => [data as Artwork, ...prev]);
    setIsAddModalOpen(false);
  };
  
  const handleUpdateArtwork = async (updatedArtwork: Artwork) => {
    const newImageDataUrls = updatedArtwork.image_urls.filter(url => url.startsWith('data:image'));
    const existingImageUrls = updatedArtwork.image_urls.filter(url => !url.startsWith('data:image'));

    const uploadPromises = newImageDataUrls.map(dataUrl => uploadImage(dataUrl));
    const newlyUploadedUrls = await Promise.all(uploadPromises);

    const finalImageUrls = [...existingImageUrls, ...newlyUploadedUrls];
    
    const artworkDataToUpdate = {
      title: updatedArtwork.title,
      artist: updatedArtwork.artist,
      year: updatedArtwork.year,
      image_urls: finalImageUrls,
      size: updatedArtwork.size,
      memo: updatedArtwork.memo,
    };

    const { data, error } = await supabase
      .from('artworks')
      .update(artworkDataToUpdate)
      .eq('id', updatedArtwork.id)
      .select()
      .single();
    if (error) throw error;
    setArtworks(prev => prev.map(a => (a.id === updatedArtwork.id ? data as Artwork : a)));
    setIsEditModalOpen(false);
    setEditingArtwork(null);
  };

  const handleDeleteArtwork = async () => {
    if (!itemToDelete || itemTypeToDelete !== '작품') return;
    const { error } = await supabase.from('artworks').delete().eq('id', itemToDelete.id);
    if (error) {
        console.error("Error deleting artwork:", error);
        alert("작품 삭제 중 오류가 발생했습니다.");
    } else {
        setArtworks(prev => prev.filter(a => a.id !== itemToDelete.id));
    }
    setItemToDelete(null);
    setItemTypeToDelete('');
  };

  // Exhibition CRUD Handlers
  const handleAddExhibition = async (title: string, description: string, imageFiles: File[]) => {
    const maxOrder = exhibitions.length > 0 ? Math.max(...exhibitions.map(e => e.display_order || 0)) : 0;
    const newOrder = maxOrder + 1;

    const uploadPromises = imageFiles.map(file => uploadImage(file));
    const imageUrls = await Promise.all(uploadPromises);

    const { data, error } = await supabase
      .from('exhibitions')
      .insert([{ title, description, image_urls: imageUrls, display_order: newOrder }])
      .select()
      .single();
    if (error) throw error;
    setExhibitions(prev => [data as Exhibition, ...prev]);
  };

  const handleUpdateExhibition = async (updatedExhibition: Exhibition) => {
    const newImageDataUrls = updatedExhibition.image_urls.filter(url => url.startsWith('data:image'));
    const existingImageUrls = updatedExhibition.image_urls.filter(url => !url.startsWith('data:image'));

    const uploadPromises = newImageDataUrls.map(dataUrl => uploadImage(dataUrl));
    const newlyUploadedUrls = await Promise.all(uploadPromises);

    const finalImageUrls = [...existingImageUrls, ...newlyUploadedUrls];
    
    const exhibitionDataToUpdate = {
      title: updatedExhibition.title,
      description: updatedExhibition.description,
      image_urls: finalImageUrls,
      display_order: updatedExhibition.display_order,
    };

    const { data, error } = await supabase
      .from('exhibitions')
      .update(exhibitionDataToUpdate)
      .eq('id', updatedExhibition.id)
      .select()
      .single();
    if (error) throw error;
    setExhibitions(prev => prev.map(e => (e.id === updatedExhibition.id ? data as Exhibition : e)).sort((a, b) => b.display_order - a.display_order));
    setIsEditExhibitionModalOpen(false);
    setEditingExhibition(null);
  };

  const handleDeleteExhibition = async () => {
    if (!itemToDelete || itemTypeToDelete !== '전시회') return;
    const { error } = await supabase.from('exhibitions').delete().eq('id', itemToDelete.id);
    if (error) {
        console.error("Error deleting exhibition:", error);
        alert("전시회 삭제 중 오류가 발생했습니다.");
    } else {
        setExhibitions(prev => prev.filter(e => e.id !== itemToDelete.id));
    }
    setItemToDelete(null);
    setItemTypeToDelete('');
  };

  // Modal Open/Close Handlers
  const openEditModal = (artwork: Artwork) => { setEditingArtwork(artwork); setIsEditModalOpen(true); };
  const openAddModal = () => setIsAddModalOpen(true);
  const openDeleteModal = (item: Artwork | Exhibition, type: '작품' | '전시회') => { setItemToDelete(item); setItemTypeToDelete(type); };
  const openEditExhibitionModal = (exhibition: Exhibition) => { setEditingExhibition(exhibition); setIsEditExhibitionModalOpen(true); };

  const closeDeleteModal = () => { setItemToDelete(null); setItemTypeToDelete(''); };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Spinner size="h-16 w-16" />
      </div>
    );
  }

  const renderPage = () => {
    switch(currentPage) {
      case 'landing':
        return <LandingPage 
                  onEnterGallery={() => handleNavigate('gallery')} 
                  onEnterProfile={() => handleNavigate('profile')}
                  onEnterExhibition={() => handleNavigate('exhibition')}
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
                  onEditExhibition={openEditExhibitionModal}
                  onDeleteExhibition={(ex) => openDeleteModal(ex, '전시회')}
                  isLoading={isLoading}
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
            />
            <main className="container mx-auto">
              <Gallery 
                artworks={filteredArtworks}
                onSelectArtwork={setSelectedArtwork}
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
                  aria-label="새 작품 추가"
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

      {/* Modals are now rendered at the top level, so they are available on all pages */}
      <ArtworkDetailModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
      <EditArtworkModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        artworkToEdit={editingArtwork}
        onUpdate={handleUpdateArtwork}
        onDelete={(art) => {
            setIsEditModalOpen(false);
            openDeleteModal(art, '작품');
        }}
      />
       <GenerateArtworkModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddNewArtwork}
      />
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        onClose={closeDeleteModal}
        onConfirm={itemTypeToDelete === '작품' ? handleDeleteArtwork : handleDeleteExhibition}
        itemNameToDelete={itemToDelete?.title || ''}
        itemType={itemTypeToDelete || ''}
      />
      <AdminPasswordModal 
        isOpen={isPasswordPromptOpen}
        onClose={() => setIsPasswordPromptOpen(false)}
        onSubmit={handleAdminPasswordSubmit}
      />
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onUpdatePassword={handleUpdatePassword}
      />
      <EditExhibitionModal
        isOpen={isEditExhibitionModalOpen}
        onClose={() => setIsEditExhibitionModalOpen(false)}
        exhibitionToEdit={editingExhibition}
        onUpdate={handleUpdateExhibition}
      />
    </div>
  );
};

export default App;