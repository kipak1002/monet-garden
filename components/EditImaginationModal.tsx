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
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  
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

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreviewUrl(null);
    }
  }, [videoFile]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
    if (!isVideo) {
      alert('동영상 파일(.mp4, .mov, .webm 등)을 선택해주세요.');
      return;
    }
    setVideoFile(file);
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(.jpg, .png, .webp 등)을 선택해주세요.');
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || !formData.title.trim()) {
      alert('작품 제목을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(
        itemToEdit.id, 
        formData.title.trim(), 
        formData.size.trim(), 
        formData.year, 
        videoFile || undefined, 
        imageFile || undefined
      );
      onClose();
    } catch (error) {
      console.error(error);
      alert('수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !itemToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Icon type="video" className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">상상갤러리 작품 수정</h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting}><Icon type="close" className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">작품 제목 *</label>
            <textarea 
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">제작년도</label>
              <input 
                type="number" 
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">크기</label>
              <input 
                type="text" 
                placeholder="예: 100x100cm"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">파일 변경 (선택 사항)</h3>
            
            {/* 동영상 교체 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">비디오 파일 교체</label>
                {videoFile && (
                  <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">새 파일 선택됨</span>
                )}
              </div>
              <input 
                type="file" 
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/*,.mp4,.mov,.webm,.m4v,.avi,.mkv" 
                className="hidden" 
                ref={videoInputRef} 
                onChange={e => handleVideoSelect(e.target.files?.[0] || null)} 
              />
              
              {videoPreviewUrl ? (
                <div className="relative border-2 border-blue-400 bg-black rounded-xl overflow-hidden shadow-inner">
                  <video src={videoPreviewUrl} controls muted playsInline className="w-full max-h-48 object-contain mx-auto" />
                  <div className="p-2 bg-gray-900/90 text-white text-xs flex justify-between items-center">
                    <span className="truncate max-w-[240px]">{videoFile?.name}</span>
                    <button
                      type="button"
                      onClick={() => { setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = ''; }}
                      className="px-2 py-1 bg-red-500/80 hover:bg-red-500 rounded text-xs transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingVideo(true); }}
                  onDragLeave={() => setIsDraggingVideo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingVideo(false);
                    if (e.dataTransfer.files?.[0]) handleVideoSelect(e.dataTransfer.files[0]);
                  }}
                  onClick={() => videoInputRef.current?.click()}
                  className={`w-full py-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isDraggingVideo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50/30'
                  }`}
                >
                  <Icon type="video" className="w-5 h-5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">새 비디오 파일 선택 (MP4, MOV, WEBM)</span>
                </div>
              )}
            </div>

            {/* 원화 이미지 교체 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">원화 이미지 교체</label>
                {imageFile && (
                  <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">새 이미지 선택됨</span>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*,.jpg,.jpeg,.png,.webp" 
                className="hidden" 
                ref={imageInputRef} 
                onChange={e => handleImageSelect(e.target.files?.[0] || null)} 
              />
              
              {imagePreviewUrl ? (
                <div className="border border-gray-200 rounded-lg p-2 flex items-center gap-3 bg-gray-50">
                  <img src={imagePreviewUrl} alt="새 이미지 미리보기" className="w-14 h-14 object-cover rounded-md border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{imageFile?.name}</p>
                    <p className="text-[10px] text-gray-500">저장 시 이 이미지로 교체됩니다</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                    className="p-1.5 text-xs text-red-500 hover:text-red-700 rounded border bg-white"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full py-3.5 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors border-gray-300 hover:border-blue-500 hover:bg-blue-50/30"
                >
                  <Icon type="upload" className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">새 원화 이미지 선택</span>
                </div>
              )}
            </div>
          </div>

          {isSubmitting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700 text-xs animate-pulse">
              <Spinner size="h-4 w-4" />
              <span>파일을 업데이트하고 있습니다. 잠시만 기다려주세요...</span>
            </div>
          )}
        </form>

        <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting} 
            className="px-6 py-2.5 border rounded-lg hover:bg-white transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center min-w-[130px] transition-colors text-sm shadow-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Spinner size="h-4 w-4" />
                <span>수정 중...</span>
              </div>
            ) : '수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditImaginationModal;
