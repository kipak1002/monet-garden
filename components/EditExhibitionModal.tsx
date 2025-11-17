import React, { useState, useEffect, useRef } from 'react';
import type { Exhibition } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';

interface EditExhibitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibitionToEdit: Exhibition | null;
  onUpdate: (updatedExhibition: Exhibition) => Promise<void>;
}

type ExhibitionEditData = Omit<Exhibition, 'id' | 'created_at'>;

const EditExhibitionModal: React.FC<EditExhibitionModalProps> = ({ isOpen, onClose, exhibitionToEdit, onUpdate }) => {
  const [formData, setFormData] = useState<ExhibitionEditData>({ title: '', image_urls: [], description: '', display_order: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (exhibitionToEdit) {
      setFormData({
        title: exhibitionToEdit.title,
        image_urls: exhibitionToEdit.image_urls || [],
        description: exhibitionToEdit.description || '',
        display_order: exhibitionToEdit.display_order,
      });
      setIsSubmitting(false);
    }
  }, [exhibitionToEdit]);

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
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSaveChanges = async () => {
    if (exhibitionToEdit) {
        if (!formData.title) {
            alert("제목은 필수 필드입니다.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onUpdate({ ...formData, id: exhibitionToEdit.id, created_at: exhibitionToEdit.created_at });
        } catch (error) {
            console.error("Failed to update exhibition", error);
            alert("변경사항 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
            setIsSubmitting(false);
        }
    }
  };

  if (!isOpen || !exhibitionToEdit) return null;

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
            <h2 className="text-2xl font-bold text-gray-900">전시회 편집</h2>
            <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 transition-colors"
            aria-label="Close"
            >
                <Icon type="close" className="w-8 h-8" />
            </button>
        </div>
        <div className='p-6 md:p-8 overflow-y-auto space-y-6 flex-1 min-h-0'>
            <div>
                <label htmlFor="ex-edit-title" className="block text-sm font-medium text-gray-700">전시회 제목</label>
                <input type="text" name="title" id="ex-edit-title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100" disabled={isSubmitting}/>
            </div>

            <div>
              <label htmlFor="ex-edit-description" className="block text-sm font-medium text-gray-700">전시회 정보</label>
              <textarea 
                  name="description" 
                  id="ex-edit-description" 
                  value={formData.description || ''} 
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="전시회에 대한 설명을 입력하세요."
                  disabled={isSubmitting}
              />
            </div>

            <div className='space-y-4'>
                <h4 className='text-sm font-medium text-gray-700'>이미지 관리</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.image_urls.map((url, index) => (
                        <div key={index} className="relative group">
                            <img src={url} alt={`Exhibition image ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                                disabled={isSubmitting}
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
                        disabled={isSubmitting}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                    >
                        <Icon type="plus" className="w-5 h-5 mr-2"/>
                        이미지 추가
                    </button>
                </div>
            </div>
        </div>
        <div className="p-6 bg-gray-50 border-t flex justify-end items-center gap-3">
            <button onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-100">
                취소
            </button>
            <button onClick={handleSaveChanges} disabled={isSubmitting} className="w-36 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center">
                {isSubmitting ? <Spinner size="h-5 w-5" /> : '변경사항 저장'}
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

export default EditExhibitionModal;