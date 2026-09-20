import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';

interface AddImaginationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, size: string, year: number, videoFile: File, originalImage?: File) => Promise<void>;
}

const AddImaginationModal: React.FC<AddImaginationModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ title: '', size: '', year: new Date().getFullYear() });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when files change or modal closes
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
    // 비디오 파일인지 확인 또는 확장자 확인
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
    if (!formData.title.trim()) {
      alert('작품 제목을 입력해주세요.');
      return;
    }
    if (!videoFile) {
      alert('동영상 파일을 등록해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(formData.title.trim(), formData.size.trim(), formData.year, videoFile, imageFile || undefined);
      setFormData({ title: '', size: '', year: new Date().getFullYear() });
      setVideoFile(null);
      setImageFile(null);
      onClose();
    } catch (error) {
      console.error(error);
      alert('동영상 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Icon type="video" className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">상상갤러리 동영상 작품 추가</h2>
          </div>
          <button onClick={onClose} disabled={isSubmitting}><Icon type="close" className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">작품 제목 *</label>
            <textarea 
              required
              placeholder="작품의 제목을 입력하세요"
              className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              rows={2}
            />
          </div>

          {/* 제작년도 및 크기 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">제작년도</label>
              <input 
                type="number" 
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={formData.year}
                onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">크기</label>
              <input 
                type="text" 
                placeholder="예: 100x100cm 또는 가변크기"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={formData.size}
                onChange={e => setFormData({...formData, size: e.target.value})}
              />
            </div>
          </div>

          {/* 동영상 파일 업로드 섹션 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-800">
                동영상 파일 * <span className="text-xs font-normal text-blue-600">(MP4, MOV, WEBM 지원)</span>
              </label>
              {videoFile && (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </span>
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
              <div className="relative border-2 border-blue-400 bg-black rounded-xl overflow-hidden shadow-inner group">
                <video 
                  src={videoPreviewUrl} 
                  controls 
                  muted 
                  playsInline 
                  className="w-full max-h-52 object-contain mx-auto"
                />
                <div className="p-2.5 bg-gray-900/90 text-white text-xs flex justify-between items-center">
                  <span className="truncate max-w-[240px] font-mono">{videoFile?.name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      onClick={() => { setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = ''; }}
                      className="px-2.5 py-1 bg-red-500/80 hover:bg-red-500 rounded text-xs transition-colors"
                    >
                      삭제
                    </button>
                  </div>
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
                className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
                  isDraggingVideo 
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50/40 bg-gray-50/50'
                }`}
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <Icon type="video" className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">클릭하여 동영상 파일 선택</p>
                  <p className="text-xs text-gray-500 mt-0.5">또는 동영상 파일을 여기로 드래그하세요</p>
                </div>
              </div>
            )}
          </div>

          {/* 원화 이미지 (선택 사항) */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-800">
                원화 이미지 <span className="text-xs font-normal text-gray-500">(선택 사항 - 미등록 시 동영상 대표 프레임 자동 사용)</span>
              </label>
              {imageFile && (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  선택됨
                </span>
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
              <div className="relative border border-gray-200 rounded-lg p-2 flex items-center gap-3 bg-gray-50">
                <img src={imagePreviewUrl} alt="원화 미리보기" className="w-16 h-16 object-cover rounded-md border" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{imageFile?.name}</p>
                  <p className="text-[11px] text-gray-500">원화 이미지가 등록되었습니다</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-1.5 text-xs text-gray-600 hover:text-blue-600 rounded border bg-white"
                  >
                    변경
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); if (imageInputRef.current) imageInputRef.current.value = ''; }}
                    className="p-1.5 text-xs text-red-500 hover:text-red-700 rounded border bg-white"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImage(false);
                  if (e.dataTransfer.files?.[0]) handleImageSelect(e.dataTransfer.files[0]);
                }}
                onClick={() => imageInputRef.current?.click()}
                className={`w-full py-4 border border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isDraggingImage ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
                }`}
              >
                <Icon type="upload" className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">원화 사진 추가 (미선택 시 비디오 첫 장면 자동 사용)</span>
              </div>
            )}
          </div>

          {isSubmitting && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700 text-xs animate-pulse">
              <Spinner size="h-4 w-4" />
              <span>동영상을 안전하게 업로드하고 있습니다. 대용량 파일일 경우 잠시만 기다려주세요...</span>
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
            disabled={isSubmitting || !videoFile}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center min-w-[130px] transition-colors text-sm shadow-sm"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Spinner size="h-4 w-4" />
                <span>업로드 중...</span>
              </div>
            ) : '작품 등록'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddImaginationModal;
