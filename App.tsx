import React, { useState, useEffect, useCallback } from 'react';
import type { Artwork } from './types';
import { generateArtworkDescription } from './services/geminiService';
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

const initialArtworks: Artwork[] = [
    { id: 1, title: 'Echoes of Silence', artist: 'Elena Petrova', year: 2023, imageUrl: 'https://picsum.photos/seed/1/800/600', size: '100cm x 70cm' },
    { id: 2, title: 'Crimson Cascade', artist: 'Kenji Tanaka', year: 2022, imageUrl: 'https://picsum.photos/seed/2/800/600', size: '80cm x 80cm' },
    { id: 3, title: 'Urban Dreams', artist: 'Maria Garcia', year: 2024, imageUrl: 'https://picsum.photos/seed/3/800/600', size: '150cm x 100cm' },
    { id: 4, title: 'Forest\'s Whisper', artist: 'Liam O\'Connell', year: 2021, imageUrl: 'https://picsum.photos/seed/4/800/600', size: '90cm x 120cm' },
    { id: 5, title: 'Celestial Dance', artist: 'Aisha Khan', year: 2023, imageUrl: 'https://picsum.photos/seed/5/800/600', size: '75cm x 100cm' },
    { id: 6, title: 'Fragmented Memories', artist: 'Lars Andersen', year: 2022, imageUrl: 'https://picsum.photos/seed/6/800/600', size: '60cm x 90cm' },
    { id: 7, title: 'Concrete Jungle', artist: 'Sofia Rossi', year: 2024, imageUrl: 'https://picsum.photos/seed/7/800/600', size: '200cm x 120cm' },
    { id: 8, title: 'Ocean\'s Breath', artist: 'David Chen', year: 2020, imageUrl: 'https://picsum.photos/seed/8/800/600', size: '120cm x 120cm' },
    { id: 9, title: 'Solar Flare', artist: 'Isabella Dubois', year: 2023, imageUrl: 'https://picsum.photos/seed/9/800/600', size: '50cm x 50cm' },
    { id: 10, title: 'Midnight Bloom', artist: 'Omar Al-Jamil', year: 2022, imageUrl: 'https://picsum.photos/seed/10/800/600', size: '80cm x 100cm' },
    { id: 11, title: 'Digital Odyssey', artist: 'Chloe Kim', year: 2024, imageUrl: 'https://picsum.photos/seed/11/800/600', size: '100cm x 150cm' },
    { id: 12, title: 'Winds of Change', artist: 'Noah Beck', year: 2021, imageUrl: 'https://picsum.photos/seed/12/800/600', size: '70cm x 70cm' },
];

const DEFAULT_ADMIN_PASSWORD = '000000';

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGalleryEntered, setIsGalleryEntered] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [galleryTitle, setGalleryTitle] = useState('내 포트폴리오');
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const [adminPassword, setAdminPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);


  useEffect(() => {
    // Load password from local storage
    const storedPassword = localStorage.getItem('adminPassword');
    if (storedPassword) {
      setAdminPassword(storedPassword);
    }

    // Simulate fetching data
    setTimeout(() => {
      setArtworks(initialArtworks);
      setFilteredArtworks(initialArtworks);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSearchChange = (term: string, sourceArtworks: Artwork[] = artworks) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredArtworks(sourceArtworks);
    } else {
      const lowercasedTerm = term.toLowerCase();
      const results = sourceArtworks.filter(
        (artwork) =>
          artwork.title.toLowerCase().includes(lowercasedTerm) ||
          artwork.artist.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredArtworks(results);
    }
  };

  const handleSelectArtwork = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedArtwork(null);
    setAiDescription(null);
  }, []);

  const handleGenerateDescription = useCallback(async () => {
    if (!selectedArtwork) return;

    setIsGenerating(true);
    setAiDescription(null);
    try {
      const description = await generateArtworkDescription(selectedArtwork.imageUrl);
      setAiDescription(description);
    } catch (error) {
      console.error(error);
      setAiDescription('Sorry, I couldn\'t generate a description for this artwork.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedArtwork]);

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
  
  const handleUpdateArtwork = (updatedArtwork: Artwork) => {
    const updatedArtworks = artworks.map(art => art.id === updatedArtwork.id ? updatedArtwork : art);
    setArtworks(updatedArtworks);
    handleSearchChange(searchTerm, updatedArtworks);
    handleCloseEditModal();
  };

  const handleOpenDeleteConfirm = (artwork: Artwork) => {
    setArtworkToDelete(artwork);
  };
  
  const handleCloseDeleteConfirm = useCallback(() => {
    setArtworkToDelete(null);
  }, []);

  const handleConfirmDelete = () => {
    if (!artworkToDelete) return;
    const updatedArtworks = artworks.filter(art => art.id !== artworkToDelete.id);
    setArtworks(updatedArtworks);
    handleSearchChange(searchTerm, updatedArtworks);
    
    if (editingArtwork?.id === artworkToDelete.id) {
        handleCloseEditModal();
    }
    
    handleCloseDeleteConfirm();
  };

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);

  const handleAddNewArtwork = (newArtworkData: Omit<Artwork, 'id'>) => {
    const newArtwork = {
      ...newArtworkData,
      id: artworks.length > 0 ? Math.max(...artworks.map(a => a.id)) + 1 : 1,
    };
    const updatedArtworks = [newArtwork, ...artworks];
    setArtworks(updatedArtworks);
    handleSearchChange(searchTerm, updatedArtworks);
    handleCloseAddModal();
  };

  const handleOpenChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const handleCloseChangePasswordModal = useCallback(() => setIsChangePasswordModalOpen(false), []);

  const handleUpdatePassword = (currentAttempt: string, newPassword: string): { success: boolean, message: string } => {
    if (currentAttempt !== adminPassword) {
      return { success: false, message: "Current password does not match." };
    }
    setAdminPassword(newPassword);
    localStorage.setItem('adminPassword', newPassword);
    handleCloseChangePasswordModal();
    return { success: true, message: "Password updated successfully!" };
  };

  if (!isGalleryEntered) {
    return <LandingPage onEnter={handleEnterGallery} galleryTitle={galleryTitle} />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header 
        galleryTitle={galleryTitle}
        onTitleChange={setGalleryTitle}
        searchTerm={searchTerm} 
        onSearchChange={(term) => handleSearchChange(term)} 
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
        isGenerating={isGenerating}
        aiDescription={aiDescription}
        onGenerateDescription={handleGenerateDescription}
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