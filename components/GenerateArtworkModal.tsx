import React, { useState, useEffect, useRef } from 'react';
import type { Artwork } from '../types';
import { generateArtworkImage } from '../services/geminiService';
import Icon from './Icon';
import Spinner from './Spinner';

interface GenerateArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newArtworkData: Omit<Artwork, 'id'>) => void;
}

const DEFAULT_FORM_DATA: Omit<Artwork, 'id'> = {
  title: '',
  artist: '',
  year: new Date().getFullYear(),
  imageUrl: 'https://storage.googleapis.com/proudcity/mebanenc/uploads/2021/03/placeholder-image.png',
  size: '',
};

const GenerateArtworkModal: React.FC<GenerateArtworkModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<Omit<Artwork, 'id'>>(DEFAULT_FORM_DATA);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setFormData(DEFAULT_FORM_DATA);
        setImagePrompt('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) || 0 : value }));
  };
  
  const handleGenerateImage = async () => {
    if (!imagePrompt || isGeneratingImage) return;
    setIsGeneratingImage(true);
    try {
      const newImageUrl = await generateArtworkImage(imagePrompt);
      setFormData(prev => ({...prev, imageUrl: newImageUrl}));
    } catch (error) {
      console.error("Failed to generate new image:", error);
      alert("Sorry, we couldn't create your new image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArtwork = () => {
    if (!formData.title || !formData.artist || !formData.year || !formData.size) {
        alert("Please fill out all fields before adding the artwork.");
        return;
    }
    onAdd(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className='p-6 md:p-8 border-b'>
            <h2 className="text-2xl font-bold text-gray-900">Add New Artwork</h2>
            <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 transition-colors"
            aria-label="Close"
            >
                <Icon type="close" className="w-8 h-8" />
            </button>
        </div>
        <div className='p-6 md:p-8 overflow-y-auto space-y-6'>
            <div>
                <label htmlFor="add-title" className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" name="title" id="add-title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label htmlFor="add-artist" className="block text-sm font-medium text-gray-700">Artist</label>
                    <input type="text" name="artist" id="add-artist" value={formData.artist} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label htmlFor="add-year" className="block text-sm font-medium text-gray-700">Year</label>
                    <input type="number" name="year" id="add-year" value={formData.year} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
            </div>
            <div>
                <label htmlFor="add-size" className="block text-sm font-medium text-gray-700">Size</label>
                <input type="text" name="size" id="add-size" value={formData.size} onChange={handleChange} placeholder="e.g., 100cm x 70cm" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            
            <div className='space-y-4 pt-2'>
                <h4 className='text-lg font-semibold text-gray-800 border-b pb-2'>Artwork Image</h4>
                <div className='w-full aspect-video rounded-md overflow-hidden bg-gray-200'>
                    {isGeneratingImage ? (
                        <div className='w-full h-full flex flex-col items-center justify-center'>
                            <Spinner size='h-10 w-10' />
                            <p className='mt-2 text-gray-600'>Generating new image...</p>
                        </div>
                    ) : (
                        <img src={formData.imageUrl} alt="New artwork" className='w-full h-full object-cover'/>
                    )}
                </div>
                
                <div className='p-4 border rounded-md bg-gray-50'>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generate with AI</label>
                    <div className='flex gap-2'>
                        <input 
                            type="text" 
                            value={imagePrompt} 
                            onChange={e => setImagePrompt(e.target.value)}
                            placeholder="e.g., A futuristic city at sunset"
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={isGeneratingImage}
                        />
                         <button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || !imagePrompt}
                            className="flex-shrink-0 flex items-center justify-center bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                           <Icon type="sparkles" className="w-5 h-5 mr-2"/>
                            Generate
                        </button>
                    </div>
                </div>
                
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">OR</span>
                    </div>
                </div>

                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isGeneratingImage}
                    >
                        <Icon type="upload" className="w-5 h-5 mr-2"/>
                        Upload an image from your device
                    </button>
                </div>
            </div>
        </div>
        <div className="p-6 bg-gray-50 border-t flex justify-end items-center gap-3">
            <button onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Cancel
            </button>
            <button onClick={handleAddArtwork} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Add Artwork
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default GenerateArtworkModal;
