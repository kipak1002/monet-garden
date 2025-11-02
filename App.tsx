import React, { useState, useEffect, useCallback } from 'react';
import type { Artwork } from './types';
import { supabase, uploadImage } from './services/supabaseClient';
import Header from './components/Header';
import Gallery from './components/Gallery';
import ArtworkDetailModal from './components/ArtworkDetailModal';
import Spinner from './components/Spinner';
import LandingPage from './components/LandingPage';
import EditArtworkModal from './components/EditArtworkModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import GenerateArtworkModal from './components/GenerateArtworkModal';
import Icon from './components/Icon';
import AdminPasswordModal from './components/AdminPasswordModal';
import ChangePasswordModal from './components/ChangePasswordModal';

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGalleryEntered, setIsGalleryEntered] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [galleryTitle, setGalleryTitle] = useState('김명진 포트폴리오');
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const settingsPromise = supabase.from('settings').select('key, value');
        const artworksPromise = supabase.from('artworks').select('*').order('created_at', { ascending: false });

        const [
          { data: settingsData, error: settingsError },
          { data: artworksData, error: artworksError }
        ] = await Promise.all([settingsPromise, artworksPromise]);
        
        if (settingsError) throw settingsError;
        if (artworksError) throw artworksError;

        const settingsMap = new Map(settingsData.map(s => [s.key, s.value]));
        setGalleryTitle(settingsMap.get('galleryTitle') || '김명진 포트폴리오');
        setAdminPassword(settingsMap.get('adminPassword') || '000000');
        
        const loadedArtworks = artworksData as Artwork[];
        setArtworks(loadedArtworks);
        setFilteredArtworks(loadedArtworks); // Initially, show all artworks

      } catch (error) {
        console.error('Error fetching initial data:', error);
        // You might want to show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

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


  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleSelectArtwork = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedArtwork(null);
  }, []);

  const handleEnterGallery = () => {
    setIsGalleryEntered(true);
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setIsPasswordPromptOpen(true);
    }
  };
  
  const handleClosePasswordPrompt = useCallback(() => setIsPasswordPromptOpen(false), []);
  
  const handlePasswordSubmit = (password: string): boolean => {
    if (password === adminPassword) {
      setIsAdminMode(true);
      setIsPasswordPromptOpen(false);
      return true;
    }
    return false;
  };

  const handleOpenEditModal = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = useCallback(() => {
    setEditingArtwork(null);
    setIsEditModalOpen(false);
  }, []);
  
  const handleUpdateArtwork = async (updatedArtworkData: Artwork) => {
    let finalImageUrl = updatedArtworkData.image_url;

    // Check if the image is a new upload (data URL)
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
        finalImageUrl = await uploadImage(finalImageUrl);
    }

    const artworkToUpdate = {
        ...updatedArtworkData,
        image_url: finalImageUrl,
    };
    // remove id before sending to supabase
    const { id, created_at, ...updateData } = artworkToUpdate;

    const { data, error } = await supabase
      .from('artworks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
        console.error("Error updating artwork:", error);
        throw error; // Propagate error to the modal
    } else if (data) {
        const updatedArtworks = artworks.map(art => art.id === data.id ? data : art);
        setArtworks(updatedArtworks as Artwork[]);
        handleCloseEditModal();
    }
  };

  const handleOpenDeleteConfirm = (artwork: Artwork) => {
    setArtworkToDelete(artwork);
  };
  
  const handleCloseDeleteConfirm = useCallback(() => {
    setArtworkToDelete(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!artworkToDelete) return;

    const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artworkToDelete.id);

    if (error) {
        console.error("Error deleting artwork:", error);
        alert(`작품 삭제 중 오류가 발생했습니다: ${error.message}`);
    } else {
        const updatedArtworks = artworks.filter(art => art.id !== artworkToDelete.id);
        setArtworks(updatedArtworks);
        
        if (editingArtwork?.id === artworkToDelete.id) {
            handleCloseEditModal();
        }
        handleCloseDeleteConfirm();
    }
  };

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);

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
    
    if (error) {
        console.error("Error adding new artwork:", error);
        throw error; // Propagate error to the modal
    } else if (data) {
        const updatedArtworks = [data, ...artworks];
        setArtworks(updatedArtworks as Artwork[]);
        handleCloseAddModal();
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    // Optimistic UI update
    setGalleryTitle(newTitle);
    const { error } = await supabase
      .from('settings')
      .update({ value: newTitle })
      .eq('key', 'galleryTitle');
    
    if (error) {
      console.error("Error updating title:", error);
      // Optional: you could revert the title here and show an error message
    }
  };

  const handleOpenChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const handleCloseChangePasswordModal = useCallback(() => setIsChangePasswordModalOpen(false), []);

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
    handleCloseChangePasswordModal();
    return { success: true, message: "비밀번호가 성공적으로 업데이트되었습니다!" };
  };

  if (!isGalleryEntered) {
    return <LandingPage onEnter={handleEnterGallery} galleryTitle={galleryTitle} subtitle="당신의 특별한 작품들을 모아 전시하는 개인 갤러리입니다." />
  }
  
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header 
        galleryTitle={galleryTitle}
        onTitleChange={handleTitleChange}
        searchTerm={searchTerm} 
        onSearchChange={handleSearchChange} 
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        onOpenChangePasswordSettings={handleOpenChangePasswordModal}
      />
      <main className="container mx-auto">
        {isLoading ? (
            <div className="flex justify-center items-center h-96">
                <Spinner size="h-16 w-16" />
            </div>
        ) : (
            <Gallery 
              artworks={filteredArtworks} 
              onSelectArtwork={handleSelectArtwork}
              isAdminMode={isAdminMode}
              onEditArtwork={handleOpenEditModal}
              onDeleteArtwork={handleOpenDeleteConfirm}
            />
        )}
      </main>
      
      {isAdminMode && (
        <button
          onClick={handleOpenAddModal}
          className="fixed bottom-8 right-8 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-110 transition-all duration-300 z-20"
          title="Add New Artwork"
          aria-label="Add New Artwork"
        >
          <Icon type="plus" className="w-8 h-8" />
        </button>
      )}

      <ArtworkDetailModal
        artwork={selectedArtwork}
        onClose={handleCloseModal}
      />
      <EditArtworkModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        artworkToEdit={editingArtwork}
        onUpdate={handleUpdateArtwork}
        onDelete={handleOpenDeleteConfirm}
      />
       <GenerateArtworkModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onAdd={handleAddNewArtwork}
      />
      <ConfirmDeleteModal
        isOpen={!!artworkToDelete}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        artworkTitle={artworkToDelete?.title || ''}
      />
       <AdminPasswordModal
        isOpen={isPasswordPromptOpen}
        onClose={handleClosePasswordPrompt}
        onSubmit={handlePasswordSubmit}
      />
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={handleCloseChangePasswordModal}
        onUpdatePassword={handleUpdatePassword}
      />
    </div>
  );
};

export default App;