import React, { useState, useEffect, useCallback } from 'react';
import type { Artwork, Exhibition } from '../types';
import { supabase, uploadImage } from '../services/supabaseClient';
import Header from './Header';
import Gallery from './Gallery';
import ArtworkDetailModal from './ArtworkDetailModal';
import Spinner from './Spinner';
import LandingPage from './LandingPage';
import EditArtworkModal from './EditArtworkModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import GenerateArtworkModal from './GenerateArtworkModal';
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

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  
  // Exhibition Modals State
  const [isEditExhibitionModalOpen, setIsEditExhibitionModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [exhibitionToDelete, setExhibitionToDelete] = useState<Exhibition | null>(null);


  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsPromise = supabase.from('settings').select('key, value');
      const artworksPromise = supabase.from('artworks').select('*').order('created_at', { ascending: false });
      const exhibitionsPromise = supabase.from('exhibitions').select('*').order('created_at', { ascending: false });

      const [
        { data: settingsData, error: settingsError },
        { data: artworksData, error: artworksError },
        { data: exhibitionsData, error: exhibitionsError }
      ] = await Promise.all([settingsPromise, artworksPromise, exhibitionsPromise]);
      
      if (settingsError) throw settingsError;
      if (artworksError) throw artworksError;
      if (exhibitionsError) throw exhibitionsError;

      const settingsMap = new Map(settingsData.map(s => [s.key, s.value]));
      setGalleryTitle(String(settingsMap.get('galleryTitle') || '김명진 포트폴리오'));
      setAdminPassword(String(settingsMap.get('adminPassword') || '000000'));
      
      setArtworks(artworksData as Artwork[]);
      setFilteredArtworks(artworksData as Artwork[]);
      setExhibitions(exhibitionsData as Exhibition[]);

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    if (!lowercasedTerm) {
      setFilteredArtworks(artworks);
    } else {
      const results = artworks.filter(
        (artwork) =>
          artwork.title.toLowerCase().includes(lowercasedTerm) ||
          artwork.artist.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredArtworks(results);
    }
  }, [searchTerm, artworks]);

  // Navigation
  const navigateTo = (page: Page) => setCurrentPage(page);

  // Admin Mode
  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setIsPasswordPromptOpen(true);
    }
  };
  
  const handlePasswordSubmit = (password: string): boolean => {
    if (password === adminPassword) {
      setIsAdminMode(true);
      setIsPasswordPromptOpen(false);
      return true;
    }
    return false;
  };
  
  const handleUpdatePassword = async (currentAttempt: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    if (currentAttempt !== adminPassword) {
      return { success: false, message: "현재 비밀번호가 일치하지 않습니다." };
    }

    const { error } = await supabase
      .from('settings')
      .update({ value: newPassword })
      .eq('key', 'adminPassword');

    if (error) {
        console.error("Error updating password:", error);
        return { success: false, message: "데이터베이스에서 비밀번호 업데이트에 실패했습니다." };
    }

    setAdminPassword(newPassword);
    setIsChangePasswordModalOpen(false);
    return { success: true, message: "비밀번호가 성공적으로 업데이트되었습니다!" };
  };

  // Gallery Title
  const handleTitleChange = async (newTitle: string) => {
    setGalleryTitle(newTitle);
    const { error } = await supabase
      .from('settings')
      .update({ value: newTitle })
      .eq('key', 'galleryTitle');
    
    if (error) console.error("Error updating title:", error);
  };
  
  // Artwork CRUD
  const handleAddNewArtwork = async (newArtworkData: Omit<Artwork, 'id' | 'created_at'>) => {
    let finalImageUrl = newArtworkData.image_url;
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        finalImageUrl = await uploadImage(finalImageUrl);
    }
    const { data, error } = await supabase
        .from('artworks')
        .insert([{ ...newArtworkData, image_url: finalImageUrl }])
        .select()
        .single();
    if (error) { throw error; } 
    setArtworks([data as Artwork, ...artworks]);
    setIsAddModalOpen(false);
  };
  
  const handleUpdateArtwork = async (updatedArtworkData: Artwork) => {
    let finalImageUrl = updatedArtworkData.image_url;
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        finalImageUrl = await uploadImage(finalImageUrl);
    }
    const { id, created_at, ...updateData } = { ...updatedArtworkData, image_url: finalImageUrl };
    const { data, error } = await supabase.from('artworks').update(updateData).eq('id', id).select().single();
    if (error) { throw error; }
    setArtworks(artworks.map(art => art.id === data.id ? data : art) as Artwork[]);
    setIsEditModalOpen(false);
  };
  
  const handleConfirmDeleteArtwork = async () => {
    if (!artworkToDelete) return;
    const { error } = await supabase.from('artworks').delete().eq('id', artworkToDelete.id);
    if (error) {
        alert(`작품 삭제 중 오류가 발생했습니다: ${error.message}`);
    } else {
        setArtworks(artworks.filter(art => art.id !== artworkToDelete.id));
        setArtworkToDelete(null);
    }
  };

  // Exhibition CRUD
  const handleAddExhibition = async (title: string, imageFile: File) => {
    const imageUrl = await uploadImage(imageFile);
    const { data, error } = await supabase.from('exhibitions').insert({ title, image_url: imageUrl }).select().single();
    if (error) { throw error; }
    setExhibitions([data as Exhibition, ...exhibitions]);
  };
  
  const handleUpdateExhibition = async (updatedExhibition: Exhibition) => {
    let finalImageUrl = updatedExhibition.image_url;
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        finalImageUrl = await uploadImage(finalImageUrl);
    }
    const { id, created_at, ...updateData } = { ...updatedExhibition, image_url: finalImageUrl };
    const { data, error } = await supabase.from('exhibitions').update(updateData).eq('id', id).select().single();
    if (error) { throw error; }
    setExhibitions(exhibitions.map(ex => ex.id === data.id ? data : ex) as Exhibition[]);
    setIsEditExhibitionModalOpen(false);
  };
  
  const handleConfirmDeleteExhibition = async () => {
    if (!exhibitionToDelete) return;
    const { error } = await supabase.from('exhibitions').delete().eq('id', exhibitionToDelete.id);
    if (error) {
        alert(`전시회 삭제 중 오류가 발생했습니다: ${error.message}`);
    } else {
        setExhibitions(exhibitions.filter(ex => ex.id !== exhibitionToDelete.id));
        setExhibitionToDelete(null);
    }
  };

  // Render Logic
  const renderPage = () => {
    switch (currentPage) {
      case 'gallery':
        return (
          <>
            <Header 
              galleryTitle={galleryTitle}
              onTitleChange={handleTitleChange}
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
              isAdminMode={isAdminMode}
              onToggleAdminMode={handleToggleAdminMode}
              onOpenChangePasswordSettings={() => setIsChangePasswordModalOpen(true)}
            />
            <main className="container mx-auto">
              {isLoading ? (
                  <div className="flex justify-center items-center h-96"> <Spinner size="h-16 w-16" /> </div>
              ) : (
                  <Gallery 
                    artworks={filteredArtworks} 
                    onSelectArtwork={setSelectedArtwork}
                    isAdminMode={isAdminMode}
                    onEditArtwork={(art) => { setEditingArtwork(art); setIsEditModalOpen(true); }}
                    onDeleteArtwork={setArtworkToDelete}
                  />
              )}
            </main>
          </>
        );
      case 'profile':
        return <ArtistProfilePage onNavigateHome={() => navigateTo('landing')} isAdminMode={isAdminMode} />;
      case 'exhibition':
        return <ExhibitionPage 
                  onNavigateHome={() => navigateTo('landing')} 
                  isAdminMode={isAdminMode}
                  exhibitions={exhibitions}
                  onAddExhibition={handleAddExhibition}
                  onEditExhibition={(ex) => { setEditingExhibition(ex); setIsEditExhibitionModalOpen(true); }}
                  onDeleteExhibition={setExhibitionToDelete}
                  isLoading={isLoading}
                />;
      case 'landing':
      default:
        return (
          <LandingPage 
            onEnterGallery={() => navigateTo('gallery')}
            onEnterProfile={() => navigateTo('profile')}
            onEnterExhibition={() => navigateTo('exhibition')}
            galleryTitle={galleryTitle} 
            subtitle="당신의 특별한 작품들을 모아 전시하는 개인 갤러리입니다." 
          />
        );
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {renderPage()}
      
      {currentPage === 'gallery' && isAdminMode && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-110 transition-all duration-300 z-20"
          title="새 작품 추가"
          aria-label="새 작품 추가"
        >
          <Icon type="plus" className="w-8 h-8" />
        </button>
      )}

      {/* Modals */}
      <ArtworkDetailModal artwork={selectedArtwork} onClose={() => setSelectedArtwork(null)} />
      <EditArtworkModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} artworkToEdit={editingArtwork} onUpdate={handleUpdateArtwork} onDelete={setArtworkToDelete} />
      <GenerateArtworkModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewArtwork} />
      {/* FIX: Changed prop name from 'artworkTitle' to 'itemNameToDelete' to match the generic modal implementation. */}
      <ConfirmDeleteModal isOpen={!!artworkToDelete} onClose={() => setArtworkToDelete(null)} onConfirm={handleConfirmDeleteArtwork} itemNameToDelete={artworkToDelete?.title || ''} itemType="작품" />
      <AdminPasswordModal isOpen={isPasswordPromptOpen} onClose={() => setIsPasswordPromptOpen(false)} onSubmit={handlePasswordSubmit} />
      <ChangePasswordModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} onUpdatePassword={handleUpdatePassword} />
      <EditExhibitionModal isOpen={isEditExhibitionModalOpen} onClose={() => setIsEditExhibitionModalOpen(false)} exhibitionToEdit={editingExhibition} onUpdate={handleUpdateExhibition} />
      {/* FIX: Changed prop name from 'artworkTitle' to 'itemNameToDelete' to match the generic modal implementation. */}
      <ConfirmDeleteModal isOpen={!!exhibitionToDelete} onClose={() => setExhibitionToDelete(null)} onConfirm={handleConfirmDeleteExhibition} itemNameToDelete={exhibitionToDelete?.title || ''} itemType="전시회" />
    </div>
  );
};

export default App;
