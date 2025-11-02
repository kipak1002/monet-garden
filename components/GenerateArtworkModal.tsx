import React, { useState, useEffect, useRef } from 'react';
import type { Artwork } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';

// FIX: Replaced Omit<Artwork, 'id' | 'created_at'> with an explicit type to resolve a TypeScript error.
type NewArtworkData = {
    title: string;
    artist: string;
    year: number;
    image_url: string;
    size: string;
    memo?: string | null;
};

interface GenerateArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newArtworkData: NewArtworkData) => Promise<void>;
}

const DEFAULT_FORM_DATA: NewArtworkData = {
  title: '',
  artist: '',
  year: new Date().getFullYear(),
  image_url: '',
  size: '',
  memo: '',
};

const GenerateArtworkModal: React.FC<GenerateArtworkModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState<NewArtworkData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setFormData(DEFAULT_FORM_DATA);
        setIsSubmitting(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value) || 0 : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, image_url: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArtwork = async () => {
    if (!formData.title || !formData.artist || !formData.year || !formData.size || !formData.image_url) {
        alert("이미지를 포함한 모든 필수 필드를 입력해주세요.");
        return;
    }
    setIsSubmitting(true);
    try {
      await onAdd(formData);
    } catch(error) {
      console.error("Failed to add artwork", error);
      alert("작품 추가 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
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
            <h2 className="text-2xl font-bold text-gray-900">새 작품 추가</h2>
            <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10 transition-colors"
            aria-label="닫기"
            >
                <Icon type="close" className="w-8 h-8" />
            </button>
        </div>
        <fieldset disabled={isSubmitting} className='p-6 md:p-8 overflow-y-auto space-y-6 flex-1 min-h-0'>
            <div>
                <label htmlFor="add-title" className="block text-sm font-medium text-gray-700">제목</label>
                <input type="text" name="title" id="add-title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
            </div>
            
            <div className='space-y-4'>
                <h4 className='text-sm font-medium text-gray-700'>작품 이미지</h4>
                <div className='w-full aspect-video rounded-md overflow-hidden bg-gray-200 flex items-center justify-center'>
                    {formData.image_url ? (
                        <img src={formData.image_url} alt="새 작품 미리보기" className='w-full h-full object-cover'/>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Icon type="upload" className="w-12 h-12 mx-auto text-gray-400" />
                            <p className="mt-2 text-sm">아래 버튼을 눌러 이미지를 업로드하세요.</p>
                        </div>
                    )}
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
                        disabled={isSubmitting}
                    >
                        <Icon type="upload" className="w-5 h-5 mr-2"/>
                        기기에서 이미지 업로드
                    </button>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label htmlFor="add-artist" className="block text-sm font-medium text-gray-700">아티스트</label>
                    <input type="text" name="artist" id="add-artist" value={formData.artist} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                </div>
                <div>
                    <label htmlFor="add-year" className="block text-sm font-medium text-gray-700">연도</label>
                    <input type="number" name="year" id="add-year" value={formData.year} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
                </div>
            </div>
            <div>
                <label htmlFor="add-size" className="block text-sm font-medium text-gray-700">크기</label>
                <input type="text" name="size" id="add-size" value={formData.size} onChange={handleChange} placeholder="예: 100cm x 70cm" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
            </div>
             <div>
                <label htmlFor="add-memo" className="block text-sm font-medium text-gray-700">메모</label>
                <textarea name="memo" id="add-memo" value={formData.memo || ''} onChange={handleChange} placeholder="작품에 대한 추가적인 메모를 남겨보세요." rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"/>
            </div>
        </fieldset>
        <div className="p-6 bg-gray-50 border-t flex justify-end items-center gap-3">
            <button onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-100">
                취소
            </button>
            <button onClick={handleAddArtwork} disabled={isSubmitting} className="w-32 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center">
                {isSubmitting ? <Spinner size="h-5 w-5" /> : '작품 추가'}
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
