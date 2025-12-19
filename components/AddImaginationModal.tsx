
import React, { useState, useRef } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';

interface AddImaginationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, size: string, year: number, videoFile: File, originalImage: File) => Promise<void>;
}

const AddImaginationModal: React.FC<AddImaginationModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ title: '', size: '', year: new Date().getFullYear() });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !videoFile || !imageFile) {
      alert('모든 필수 항목(제목, 비디오, 원화)을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(formData.title, formData.size, formData.year, videoFile, imageFile);
      setFormData({ title: '', size: '', year: new Date().getFullYear() });
      setVideoFile(null);
      setImageFile(null);
      onClose();
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">상상갤러리 작품 추가</h2>
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">동영상 파일 * (MP4 권장)</label>
              <input type="file" accept="video/*" className="hidden" ref={videoInputRef} onChange={e => setVideoFile(e.target.files?.[0] || null)} />
              <button 
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className={`w-full py-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 transition-colors ${videoFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
              >
                <Icon type="video" className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium">{videoFile ? videoFile.name : '비디오 파일 업로드'}</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">원화 이미지 *</label>
              <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={e => setImageFile(e.target.files?.[0] || null)} />
              <button 
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`w-full py-4 border-2 border-dashed rounded-lg flex flex-col items-center gap-2 transition-colors ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}`}
              >
                <Icon type="upload" className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium">{imageFile ? imageFile.name : '원화 이미지 업로드'}</span>
              </button>
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-white transition-colors">취소</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? <Spinner size="h-5 w-5" /> : '작품 등록'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddImaginationModal;
