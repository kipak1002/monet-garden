import React, { useState, useEffect, useRef } from 'react';
import type { Artwork } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';
import { generateArtworkMemo } from '../services/geminiService.ts';

interface EditArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkToEdit: Artwork | null;
  onUpdate: (updatedArtwork: Artwork) => Promise<void>;
  onDelete: (artwork: Artwork) => void;
}

type ArtworkEditData = Omit<Artwork, 'id' | 'created_at'>;

const EditArtworkModal: React.FC<EditArtworkModalProps> = ({ isOpen, onClose, artworkToEdit, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState<ArtworkEditData>({ title: '', artist: '', year: 0, image_urls: [], size: '', memo: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingMemo, setIsGeneratingMemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (artworkToEdit) {
      setFormData({
        title: artworkToEdit.title,
        artist: artworkToEdit.artist,
        year: artworkToEdit.year,
        image_urls: artworkToEdit.image_urls,
        size: artworkToEdit.size,
        memo: artworkToEdit.memo || '',
      });
      setIsSubmitting(false);
      setIsGeneratingMemo(false);
    }
  }, [artworkToEdit]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) || 0 : value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  setFormData(prev => ({
                      ...prev,
                      image_urls: [...prev.image_urls, reader.result as string]
                  }));
              }
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => ({
        ...prev,
        image_urls: prev.image_urls.filter((_, index) => index !== indexToRemove)
    }));
  };
  
  const handleGenerateMemo = async () => {
    if (!formData.image_urls || formData.image_urls.length === 0) {
      alert("AI 메모를 생성하려면 먼저 이미지가 있어야 합니다.");
      return;
    }
    setIsGeneratingMemo(true);
    try {
      const memo = await generateArtworkMemo(formData.image_urls[0]);
      setFormData(prev => ({ ...prev, memo }));
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsGeneratingMemo(false);
    }
  };

  const handleSaveChanges = async () => {
    if (artworkToEdit) {
        if (!formData.title || !formData.artist || !formData.year || !formData.size || formData.image_urls.length === 0) {
            alert("이미지를 포함한 모든 필수 필드를 입력해주세요.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onUpdate({ ...formData, id: artworkToEdit.id, created_at: artworkToEdit.created_at });
        } catch (error) {
            console.error("Failed to update artwork", error);
            alert("변경사항 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
            setIsSubmitting(false);
        }
    }
  };

  if (!isOpen || !artworkToEdit) return null;

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
            <h2 className="text-2xl font-bold text-gray-900">작품 편집</h2>
            <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 transition-colors"
            aria-label="Close"
            >
                <Icon type="close" className="w-8 h-8" />
            </button>
        </div>
        <fieldset disabled={isSubmitting || isGeneratingMemo} className='p-6 md:p-8 overflow-y-auto space-y-6 flex-1 min-h-0'>
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">제목</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
            </div>

            <div className='space-y-4'>
                <h4 className='text-sm font-medium text-gray-700'>이미지 관리</h4>
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {formData.image_urls.map((url, index) => (
                        <div key={`${url.substring(0,20)}-${index}`} className="relative group aspect-square">
                            <img src={url} alt={`작품 이미지 ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-sm" />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="이미지 삭제"
                            >
                                <Icon type="trash" className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        multiple
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                    >
                        <Icon type="upload" className="w-5 h-5 mr-2"/>
                        이미지 추가
                    </button>
                </div>
            </div>
            
            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label htmlFor="artist" className="block text-sm font-medium text-gray-700">아티스트</label>
                    <input type="text" name="artist" id="artist" value={formData.artist} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                </div>
                <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">연도</label>
                    <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                </div>
            </div>
            <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700">크기</label>
                <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} placeholder="예: 100cm x 70cm" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-1">
                    <label htmlFor="memo" className="block text-sm font-medium text-gray-700">메모</label>
                     <button
                        type="button"
                        onClick={handleGenerateMemo}
                        disabled={isGeneratingMemo || formData.image_urls.length === 0}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        aria-label="AI로 메모 생성"
                    >
                        {isGeneratingMemo ? (
                            <>
                                <Spinner size="h-4 w-4" />
                                <span>생성 중...</span>
                            </>
                        ) : (
                            <>
                                <Icon type="sparkles" className="w-4 h-4" />
                                <span>AI로 생성</span>
                            </>
                        )}
                    </button>
                </div>
                <textarea name="memo" id="memo" value={formData.memo || ''} onChange={handleChange} placeholder="작품에 대한 추가적인 메모를 남겨보세요." rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
            </div>

        </fieldset>
        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <button 
            onClick={() => onDelete(artworkToEdit)} 
            disabled={isSubmitting || isGeneratingMemo}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
            >
                <Icon type="trash" className="w-5 h-5 inline-block mr-2 -mt-1" />
                작품 삭제
          </button>
          <div className='flex gap-3'>
            <button onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-100">
                취소
            </button>
            <button onClick={handleSaveChanges} disabled={isSubmitting || isGeneratingMemo} className="w-36 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center">
                {isSubmitting ? <Spinner size="h-5 w-5" /> : '변경사항 저장'}
            </button>
          </div>
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

export default EditArtworkModal;