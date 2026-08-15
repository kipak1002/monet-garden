import React, { useState, useEffect, useRef } from 'react';
import { supabase, uploadOriginalImage } from '../services/supabaseClient.ts';
import Spinner from './Spinner';
import Icon from './Icon';

interface ArtistProfilePageProps {
  isAdminMode: boolean;
}

interface ProfileTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: string;
  textAlign: 'left' | 'center' | 'justify';
}

const DEFAULT_STYLE: ProfileTextStyle = {
  fontFamily: '"Nanum Myeongjo", serif',
  fontSize: 16,
  fontWeight: '400',
  lineHeight: '1.85',
  textAlign: 'left',
};

const FONT_OPTIONS = [
  { name: '나눔명조 (우아한 세리프)', value: '"Nanum Myeongjo", Georgia, serif' },
  { name: '나눔고딕 (단정한 산세리프)', value: '"Nanum Gothic", Inter, sans-serif' },
  { name: '모던 고딕 (Pretendard/Inter)', value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { name: '클래식 세리프 (Georgia)', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { name: '바탕체 (전통 서체)', value: 'Batang, "Nanum Myeongjo", serif' },
  { name: '궁서체 (품격 서체)', value: 'Gungsuh, "Nanum Myeongjo", serif' },
];

const FONT_WEIGHT_OPTIONS = [
  { name: '보통 (Regular 400)', value: '400' },
  { name: '약간 굵게 (Medium 500)', value: '500' },
  { name: '세미볼드 (Semi-Bold 600)', value: '600' },
  { name: '굵게 (Bold 700)', value: '700' },
];

const LINE_HEIGHT_OPTIONS = [
  { name: '표준 (1.65)', value: '1.65' },
  { name: '여유있게 (1.85)', value: '1.85' },
  { name: '넓게 (2.1)', value: '2.1' },
];

const TEXT_ALIGN_OPTIONS: { name: string; value: 'left' | 'center' | 'justify' }[] = [
  { name: '왼쪽 정렬', value: 'left' },
  { name: '가운데 정렬', value: 'center' },
  { name: '양쪽 정렬', value: 'justify' },
];

/**
 * Parses markdown-like text and single/double newlines into semantic HTML elements.
 * This guarantees line breaks and paragraph spacing remain 100% intact even during automatic browser translation.
 */
const FormattedProfileContent: React.FC<{
  text: string;
  style: ProfileTextStyle;
}> = ({ text, style }) => {
  if (!text || !text.trim()) return null;

  // Split into paragraph blocks by 2 or more newlines
  const rawBlocks = text.split(/\n{2,}/);

  const renderInlineFormatted = (lineText: string) => {
    // Parse bold text **bold**
    const parts = lineText.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={index} className="font-bold text-gray-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="profile-article text-gray-800 break-words selection:bg-blue-100"
      style={{
        fontFamily: style.fontFamily,
        fontSize: `${style.fontSize}px`,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        textAlign: style.textAlign,
      }}
    >
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Divider
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={`hr-${bIdx}`} className="my-6 border-gray-200/80" />;
        }

        // H2 Heading (## Title)
        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={`h2-${bIdx}`}
              className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 mb-3 pt-2 first:mt-0 tracking-tight"
            >
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }

        // H3 Subheading (### Subtitle or [Section Title])
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={`h3-${bIdx}`}
              className="text-lg sm:text-xl font-semibold text-gray-900 mt-5 mb-2 tracking-tight"
            >
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }

        // Blockquote (> Quote)
        if (trimmed.startsWith('> ')) {
          const quoteLines = trimmed.split('\n').map((l) => l.replace(/^>\s?/, ''));
          return (
            <blockquote
              key={`quote-${bIdx}`}
              className="pl-4 py-1.5 my-4 border-l-3 border-gray-400/70 text-gray-700 italic bg-gray-50/60 rounded-r-lg"
            >
              {quoteLines.map((ql, qIdx) => (
                <div key={qIdx} className="leading-relaxed">
                  {renderInlineFormatted(ql)}
                </div>
              ))}
            </blockquote>
          );
        }

        // List block (lines starting with • or - or *)
        const lines = block.split('\n');
        const isAllList = lines.every((l) => {
          const t = l.trim();
          return !t || t.startsWith('•') || t.startsWith('-') || t.startsWith('*');
        });

        if (isAllList && lines.some((l) => l.trim().length > 0)) {
          return (
            <ul key={`ul-${bIdx}`} className="my-3 space-y-1.5 list-none pl-0">
              {lines.map((l, lIdx) => {
                const t = l.trim();
                if (!t) return null;
                const cleanItem = t.replace(/^[•\-\*]\s*/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-gray-400 select-none font-bold mt-0.5">•</span>
                    <span className="flex-1">{renderInlineFormatted(cleanItem)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph with individual line rendering (preserves line-breaks during browser translation)
        return (
          <p key={`p-${bIdx}`} className="mb-5 last:mb-0 leading-[inherit]">
            {lines.map((line, lIdx) => (
              <span key={lIdx} className="block min-h-[1em]">
                {line.trim() === '' ? (
                  <span className="inline-block h-3">&nbsp;</span>
                ) : (
                  renderInlineFormatted(line)
                )}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
};

const ArtistProfilePage: React.FC<ArtistProfilePageProps> = ({ isAdminMode }) => {
  const [profileImageUrls, setProfileImageUrls] = useState<string[]>([]);
  const [profileInfo, setProfileInfo] = useState('');
  const [profileStyle, setProfileStyle] = useState<ProfileTextStyle>(DEFAULT_STYLE);

  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviewUrls, setNewImagePreviewUrls] = useState<string[]>([]);
  const [editProfileInfo, setEditProfileInfo] = useState('');
  const [editProfileStyle, setEditProfileStyle] = useState<ProfileTextStyle>(DEFAULT_STYLE);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['artistProfile', 'artistProfileInfo', 'artistProfileStyle']);

        if (error) throw error;

        const settingsMap = new Map((data || []).map((s) => [s.key, s.value]));

        // 1. Handle Images
        const imageUrlsValue = settingsMap.get('artistProfile');
        if (imageUrlsValue) {
          try {
            const urls = typeof imageUrlsValue === 'string' ? JSON.parse(imageUrlsValue) : imageUrlsValue;
            if (Array.isArray(urls)) {
              const validUrls = urls.filter((u) => typeof u === 'string' && u.length > 0);
              setProfileImageUrls(validUrls);
              setEditImageUrls(validUrls);
            } else if (typeof urls === 'string' && urls.trim()) {
              setProfileImageUrls([urls]);
              setEditImageUrls([urls]);
            }
          } catch (e) {
            if (typeof imageUrlsValue === 'string' && imageUrlsValue.trim()) {
              setProfileImageUrls([imageUrlsValue]);
              setEditImageUrls([imageUrlsValue]);
            }
          }
        } else {
          setProfileImageUrls([]);
          setEditImageUrls([]);
        }

        // 2. Handle Text Info
        const infoValue = settingsMap.get('artistProfileInfo') || '';
        setProfileInfo(String(infoValue));
        setEditProfileInfo(String(infoValue));

        // 3. Handle Style Settings
        const styleValue = settingsMap.get('artistProfileStyle');
        if (styleValue) {
          try {
            const parsedStyle = typeof styleValue === 'string' ? JSON.parse(styleValue) : styleValue;
            const mergedStyle: ProfileTextStyle = {
              ...DEFAULT_STYLE,
              ...parsedStyle,
              fontSize: Number(parsedStyle.fontSize) || DEFAULT_STYLE.fontSize,
            };
            setProfileStyle(mergedStyle);
            setEditProfileStyle(mergedStyle);
          } catch (e) {
            setProfileStyle(DEFAULT_STYLE);
            setEditProfileStyle(DEFAULT_STYLE);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setProfileImageUrls([]);
        setProfileInfo('');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!isAdminMode) {
      setEditImageUrls(profileImageUrls);
      setEditProfileInfo(profileInfo);
      setEditProfileStyle(profileStyle);
      setNewImageFiles([]);
      newImagePreviewUrls.forEach(URL.revokeObjectURL);
      setNewImagePreviewUrls([]);
      setShowLivePreview(false);
    }
  }, [isAdminMode, profileImageUrls, profileInfo, profileStyle]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      const previews = files.map((file) => URL.createObjectURL(file));
      setNewImageFiles((prev) => [...prev, ...files]);
      setNewImagePreviewUrls((prev) => [...prev, ...previews]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setEditImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveNewImage = (indexToRemove: number) => {
    URL.revokeObjectURL(newImagePreviewUrls[indexToRemove]);
    setNewImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setNewImagePreviewUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleInsertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = editProfileInfo;
    const selectedText = currentText.substring(start, end);

    const replacement = `${prefix}${selectedText || '텍스트'}${suffix}`;
    const updated = currentText.substring(0, start) + replacement + currentText.substring(end);

    setEditProfileInfo(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 3)
      );
    }, 50);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // 1. Upload original images without compression to maintain 100% full quality & resolution
      const uploadPromises = newImageFiles.map((file) => uploadOriginalImage(file));
      const newlyUploadedUrls = await Promise.all(uploadPromises);
      const finalImageUrls = [...editImageUrls, ...newlyUploadedUrls];

      // 2. Save settings
      const saveImagesPromise = supabase
        .from('settings')
        .upsert({ key: 'artistProfile', value: JSON.stringify(finalImageUrls) }, { onConflict: 'key' });

      const saveInfoPromise = supabase
        .from('settings')
        .upsert({ key: 'artistProfileInfo', value: editProfileInfo }, { onConflict: 'key' });

      const saveStylePromise = supabase
        .from('settings')
        .upsert({ key: 'artistProfileStyle', value: JSON.stringify(editProfileStyle) }, { onConflict: 'key' });

      const [imagesResult, infoResult, styleResult] = await Promise.all([
        saveImagesPromise,
        saveInfoPromise,
        saveStylePromise,
      ]);

      if (imagesResult.error) throw imagesResult.error;
      if (infoResult.error) throw infoResult.error;
      if (styleResult.error) throw styleResult.error;

      setProfileImageUrls(finalImageUrls);
      setEditImageUrls(finalImageUrls);
      setProfileInfo(editProfileInfo);
      setProfileStyle(editProfileStyle);

      newImagePreviewUrls.forEach(URL.revokeObjectURL);
      setNewImageFiles([]);
      setNewImagePreviewUrls([]);

      alert('작가 소개(원본 사진, 글 서식 및 스타일)가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderAdminView = () => (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">About (작가 소개) 편집</h2>
          <p className="text-sm text-gray-500 mt-1">
            사진은 압축 없이 <strong>원본 해상도 그대로</strong> 선명하게 업로드되며, 텍스트 글꼴/크기/진하기를 맞춤 편집할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 1. 이미지 관리 섹션 (원본 화질 유지) */}
      <div className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Icon type="profile" className="w-5 h-5 text-gray-600" />
              <span>작가 사진 / 이미지 관리 (원본 화질 100% 유지)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              압축하지 않고 원본 용량과 해상도를 온전히 보존하여 가장 선명하게 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm flex items-center gap-1.5"
            disabled={isSaving}
          >
            <Icon type="plus" className="w-4 h-4" />
            <span>원본 사진 추가</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
          {editImageUrls.map((url, index) => (
            <div key={`existing-${url}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img src={url} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveImageModal(url)}
                  className="p-1.5 bg-white/90 text-gray-800 rounded-full hover:bg-white transition-colors"
                  title="크게 보기"
                >
                  <Icon type="search" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="삭제"
                >
                  <Icon type="trash" className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                #{index + 1}
              </span>
            </div>
          ))}

          {newImagePreviewUrls.map((url, index) => (
            <div key={`new-${url}-${index}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-blue-500 bg-white shadow-sm">
              <img src={url} alt={`New upload ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(index)}
                  className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="취소"
                >
                  <Icon type="trash" className="w-4 h-4" />
                </button>
              </div>
              <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                원본 업로드 예정
              </span>
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50/50 transition-all group"
            disabled={isSaving}
          >
            <div className="p-2.5 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
              <Icon type="upload" className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
            </div>
            <span className="text-xs font-medium mt-2 text-gray-600 group-hover:text-blue-600">사진 등록</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
            multiple
          />
        </div>
      </div>

      {/* 2. 텍스트 서식 & 스타일 설정 섹션 */}
      <div className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Icon type="edit" className="w-5 h-5 text-gray-600" />
            <span>텍스트 서식 및 스타일 설정</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            글꼴, 글자 크기, 진하기(굵기), 줄 간격, 정렬을 설정할 수 있습니다. 브라우저 번역 시에도 줄바꿈이 흐트러지지 않도록 단락 구조가 보존됩니다.
          </p>
        </div>

        {/* 컨트롤 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 bg-white p-4 rounded-xl border border-gray-200">
          {/* 글꼴 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">글꼴 (Font)</label>
            <select
              value={editProfileStyle.fontFamily}
              onChange={(e) => setEditProfileStyle((prev) => ({ ...prev, fontFamily: e.target.value }))}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 글자 크기 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-700">글자 크기</label>
              <span className="text-xs font-bold text-blue-600">{editProfileStyle.fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="13"
                max="24"
                value={editProfileStyle.fontSize}
                onChange={(e) =>
                  setEditProfileStyle((prev) => ({ ...prev, fontSize: Number(e.target.value) }))
                }
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* 진하기 (굵기) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">진하기 (Weight)</label>
            <select
              value={editProfileStyle.fontWeight}
              onChange={(e) => setEditProfileStyle((prev) => ({ ...prev, fontWeight: e.target.value }))}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {FONT_WEIGHT_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* 줄 간격 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">줄 간격</label>
            <select
              value={editProfileStyle.lineHeight}
              onChange={(e) => setEditProfileStyle((prev) => ({ ...prev, lineHeight: e.target.value }))}
              className="w-full text-xs p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {LINE_HEIGHT_OPTIONS.map((lh) => (
                <option key={lh.value} value={lh.value}>
                  {lh.name}
                </option>
              ))}
            </select>
          </div>

          {/* 텍스트 정렬 */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">정렬 (Align)</label>
            <select
              value={editProfileStyle.textAlign}
              onChange={(e) =>
                setEditProfileStyle((prev) => ({
                  ...prev,
                  textAlign: e.target.value as 'left' | 'center' | 'justify',
                }))
              }
              className="w-full text-xs p-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {TEXT_ALIGN_OPTIONS.map((ta) => (
                <option key={ta.value} value={ta.value}>
                  {ta.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 퀵 포맷팅 툴바 */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500 mr-1">서식 도구:</span>
              <button
                type="button"
                onClick={() => handleInsertFormatting('**', '**')}
                className="px-2.5 py-1 text-xs font-bold bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="굵게 강조하기"
              >
                B 굵게
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('## ')}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="대제목 (섹션 타이틀)"
              >
                H2 대제목
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('### ')}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="소제목 (학력, 전시회 등)"
              >
                H3 소제목
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('• ')}
                className="px-2.5 py-1 text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="글머리 기호 목록"
              >
                • 목록 기호
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('> ')}
                className="px-2.5 py-1 text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="작가 노트 / 인용구"
              >
                &quot; 작가노트
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting('\n---\n')}
                className="px-2.5 py-1 text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="구분선"
              >
                — 구분선
              </button>
            </div>

            {/* 미리보기 전환 */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showLivePreview
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon type="search" className="w-3.5 h-3.5" />
              <span>{showLivePreview ? '에디터 보기' : '실제 화면 미리보기'}</span>
            </button>
          </div>

          {showLivePreview ? (
            <div className="p-6 bg-white rounded-xl border border-blue-200 shadow-sm min-h-[300px]">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                [ 실시간 서식 및 줄바꿈 미리보기 ]
              </p>
              <FormattedProfileContent text={editProfileInfo} style={editProfileStyle} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={editProfileInfo}
              onChange={(e) => setEditProfileInfo(e.target.value)}
              rows={16}
              placeholder={`[예시 입력]\n## 작가 소개\n김명진 (Kim Myeong-jin)\n\n> "빛과 공간, 자연의 조화를 캔버스에 담아내는 작업을 이어오고 있습니다."\n\n### 학력 및 약력\n• 홍익대학교 미술대학 회화과 졸업\n• 홍익대학교 대학원 미술학 석사\n\n### 주요 개인전\n• 2024 초대전, 갤러리\n• 2022 개인전, 서울`}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-800 leading-relaxed bg-white shadow-inner resize-y"
              style={{
                fontFamily: editProfileStyle.fontFamily,
                fontWeight: editProfileStyle.fontWeight,
              }}
            />
          )}
          <p className="text-[11px] text-gray-500">
            * 엔터 키로 줄바꿈하거나 단락을 나누면, 번역기를 사용하더라도 줄바꿈이 흐트러지지 않고 유지됩니다.
          </p>
        </div>
      </div>

      {/* 3. 저장 액션 */}
      <div className="pt-2 flex justify-end gap-3">
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="px-8 py-3.5 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 flex justify-center items-center gap-2 transition-all transform active:scale-95"
        >
          {isSaving ? (
            <>
              <Spinner size="h-5 w-5" />
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <Icon type="check" className="w-4 h-4" />
              <span>작가 소개 및 서식 저장하기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderPublicView = () => {
    const hasImages = profileImageUrls.length > 0;
    const hasText = Boolean(profileInfo && profileInfo.trim().length > 0);

    if (!hasImages && !hasText) {
      return (
        <div className="max-w-2xl mx-auto text-center py-28 text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
            <Icon type="profile" className="w-8 h-8" />
          </div>
          <p className="text-lg font-serif text-gray-600">작가 소개가 준비 중입니다.</p>
          <p className="text-xs text-gray-400 mt-2">관리자 모드에서 작가 사진과 소개글을 등록해주세요.</p>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
        <div
          className={`grid grid-cols-1 ${
            hasImages && hasText ? 'lg:grid-cols-12 gap-12 lg:gap-16 items-start' : 'gap-10'
          }`}
        >
          {/* 이미지 영역 (원본 초고화질 렌더링) */}
          {hasImages && (
            <div className={`${hasText ? 'lg:col-span-5' : 'max-w-3xl mx-auto w-full'} space-y-6`}>
              {/* 메인 프로필 이미지 */}
              <div
                className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-lg cursor-pointer group"
                onClick={() => setActiveImageModal(profileImageUrls[0])}
              >
                <img
                  src={profileImageUrls[0]}
                  alt="작가 프로필"
                  className="w-full h-auto max-h-[750px] object-contain sm:object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs font-medium text-gray-900 shadow-md flex items-center gap-1">
                    <Icon type="search" className="w-3.5 h-3.5" />
                    <span>원본 확대 보기</span>
                  </div>
                </div>
              </div>

              {/* 추가 이미지 썸네일 그리드 */}
              {profileImageUrls.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                  {profileImageUrls.slice(1).map((url, idx) => (
                    <div
                      key={`sub-img-${idx}`}
                      onClick={() => setActiveImageModal(url)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-all group relative border border-gray-100"
                    >
                      <img
                        src={url}
                        alt={`작가 이미지 ${idx + 2}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 텍스트 영역 (번역 시 줄바꿈 유지 구조) */}
          {hasText && (
            <div className={`${hasImages ? 'lg:col-span-7' : 'max-w-3xl mx-auto w-full'} space-y-6`}>
              <FormattedProfileContent text={profileInfo} style={profileStyle} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans pt-28 md:pt-36 pb-20">
      <main className="container mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="h-12 w-12" />
          </div>
        ) : isAdminMode ? (
          renderAdminView()
        ) : (
          renderPublicView()
        )}
      </main>

      {/* 이미지 확대 모달 (원본 화질 감상) */}
      {activeImageModal && (
        <div
          className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 md:p-12 animate-fade-in"
          onClick={() => setActiveImageModal(null)}
        >
          <button
            onClick={() => setActiveImageModal(null)}
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white bg-black/40 hover:bg-black/70 rounded-full transition-colors z-10"
            aria-label="닫기"
          >
            <Icon type="close" className="w-6 h-6" />
          </button>
          <div className="max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImageModal}
              alt="작가 사진 확대"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistProfilePage;
