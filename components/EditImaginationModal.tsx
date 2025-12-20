
import React, { useState, useEffect, useRef } from 'react';
import type { ImaginationArtwork } from '../types';
import Icon from './Icon';
import Spinner from './Spinner';

interface EditImaginationModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: ImaginationArtwork | null;
  onUpdate: (id: number, title: string, size: string, year: number, videoFile?: File, originalImage?: File) => Promise<void>;
}

const EditImaginationModal: React.FC<EditImaginationModalProps> = ({ isOpen, onClose, itemToEdit, onUpdate }) => {
  const [formData, setFormData] = useState({ title: '', size: '', year: 0 });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title,
        size: itemToEdit.size,
        year: itemToEdit.year
      });
      setVideoFile(null);
      setImageFile(null);
      setIsSubmitting(false);
    }
  }, [itemToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || !formData.title) return;

    setIsSubmitting(true);
    try {
      await onUpdate(
        itemToEdit.id, 
        formData.title, 
        formData.size, 
        formData.year, 
        videoFile || undefined, 
        imageFile || undefined
      );
      onClose();
    } catch (error) {
      console.error(error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !itemToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">상상갤러리 작품 수정</h2>
          <button onClick={onClose}><Icon type="close" className="w-6 h-6 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700">작품 제목 *</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">제작년도</label>
              <input 
                type="number" 
                className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">크기</label>
              <input 
                type="text" 
                placeholder="예: 100x100cm"
                className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-800">파일 변경 (선택 사항)</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">비디오 교체</label>
              <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={e => setVideoFile(e.target.files?.[0] || null)} />
              <button 
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className={`w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${videoFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
              >
                <Icon type="video" className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{videoFile ? videoFile.name : '비디오 파일 변경'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">원화 이미지 교체</label>
              <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={e => setImageFile(e.target.files?.[0] || null)} />
              <button 
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
              >
                <Icon type="upload" className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{imageFile ? imageFile.name : '원화 이미지 변경'}</span>
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2 border rounded-lg hover:bg-white transition-colors">취소</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? <Spinner size="h-5 w-5" /> : '수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditImaginationModal;
