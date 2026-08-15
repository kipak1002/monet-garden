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
 * Correctly renders bold (**text**), links ([title](url)), raw URLs (http/https/instagram),
 * emails, headings, lists, blockquotes, and keeps line breaks intact during translation.
 */
const FormattedProfileContent: React.FC<{
  text: string;
  style: ProfileTextStyle;
}> = ({ text, style }) => {
  if (!text || !text.trim()) return null;

  // Split into paragraph blocks by 2 or more newlines
  const rawBlocks = text.split(/\n{2,}/);

  /**
   * Helper to format inline elements:
   * 1. Markdown links: [Title](url)
   * 2. Raw URLs: https://..., http://..., instagram.com/...
   * 3. Emails: mailto:... or email@domain.com
   * 4. Bold: **text**
   * 5. Italic: *text*
   */
  const renderInlineFormatted = (lineText: string): React.ReactNode => {
    // Regex for markdown links [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Split by markdown link first
    const tokens: Array<{ type: 'text' | 'mdLink'; text: string; url?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mdLinkRegex.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', text: lineText.substring(lastIndex, match.index) });
      }
      tokens.push({ type: 'mdLink', text: match[1], url: match[2] });
      lastIndex = mdLinkRegex.lastIndex;
    }
    if (lastIndex < lineText.length) {
      tokens.push({ type: 'text', text: lineText.substring(lastIndex) });
    }

    return tokens.map((token, tIdx) => {
      if (token.type === 'mdLink' && token.url) {
        let href = token.url.trim();
        if (href.startsWith('@')) {
          href = `https://instagram.com/${href.substring(1)}`;
        } else if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          if (href.includes('@') && !href.includes('/')) {
            href = `mailto:${href}`;
          } else {
            href = `https://${href}`;
          }
        }
        return (
          <a
            key={`mdl-${tIdx}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {token.text}
            <span className="text-[0.75em] opacity-70">↗</span>
          </a>
        );
      }

      // Inside normal text, parse bold (**text**), raw URLs, and emails
      const rawText = token.text;
      // Split by bold (**...**) or auto-detect raw url or email
      // We will parse bold first, then within non-bold strings parse URLs/emails
      const boldParts = rawText.split(/(\*\*[^*]+\*\*)/g);

      return (
        <React.Fragment key={`tok-${tIdx}`}>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
              const innerBold = bPart.slice(2, -2);
              return (
                <strong key={`b-${bIdx}`} className="font-bold text-gray-950">
                  {renderTextWithUrlsAndEmails(innerBold)}
                </strong>
              );
            }
            return (
              <React.Fragment key={`nb-${bIdx}`}>
                {renderTextWithUrlsAndEmails(bPart)}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      );
    });
  };

  /**
   * Helper to detect raw URLs (http, https, www., instagram.com, @username) and emails in plain text.
   */
  const renderTextWithUrlsAndEmails = (str: string): React.ReactNode => {
    if (!str) return null;

    // Pattern to catch URLs, emails, instagram tags
    const urlOrEmailPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:instagram\.com\/[a-zA-Z0-9_.]+|@[a-zA-Z0-9_.]+)|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/gi;

    const parts = str.split(urlOrEmailPattern);
    return parts.map((part, pIdx) => {
      if (!part) return null;

      // Email address
      if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(part)) {
        return (
          <a
            key={`mail-${pIdx}`}
            href={`mailto:${part}`}
            className="text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors cursor-pointer"
          >
            {part}
          </a>
        );
      }

      // Instagram handle (@username)
      if (/^@[a-zA-Z0-9_.]+$/.test(part)) {
        const username = part.substring(1);
        return (
          <a
            key={`ig-${pIdx}`}
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-800 underline underline-offset-4 decoration-pink-300 hover:decoration-pink-600 font-medium transition-colors inline-flex items-center gap-0.5 cursor-pointer"
          >
            {part}
            <span className="text-[0.75em] opacity-70">↗</span>
          </a>
        );
      }

      // Standard URLs
      if (
        part.startsWith('http://') ||
        part.startsWith('https://') ||
        part.startsWith('www.') ||
        part.startsWith('instagram.com/')
      ) {
        let href = part;
        if (href.startsWith('www.')) {
          href = `https://${href}`;
        } else if (href.startsWith('instagram.com/')) {
          href = `https://${href}`;
        }
        return (
          <a
            key={`url-${pIdx}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors inline-flex items-center gap-1 cursor-pointer break-all"
          >
            {part}
            <span className="text-[0.75em] opacity-70">↗</span>
          </a>
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
              {renderInlineFormatted(trimmed.replace(/^##\s+/, ''))}
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
              {renderInlineFormatted(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        // Blockquote (> Quote)
        if (trimmed.startsWith('> ')) {
          const quoteLines = trimmed.split('\n').map((l) => l.replace(/^>\s?/, ''));
          return (
            <blockquote
              key={`quote-${bIdx}`}
              className="pl-4 py-2 my-4 border-l-4 border-blue-400/80 text-gray-700 bg-gray-50/80 rounded-r-lg"
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

  // Link dialog modal state for quick insertion
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalTitle, setLinkModalTitle] = useState('');
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [linkModalType, setLinkModalType] = useState<'url' | 'instagram' | 'email'>('url');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

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
      setLinkModalOpen(false);
    }
  }, [isAdminMode, profileImageUrls, profileInfo, profileStyle]);

  const saveSelection = () => {
    if (textareaRef.current) {
      selectionRangeRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

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

  /**
   * Directly formats selected text in the textarea with prefix and suffix.
   * If text is selected: "selected" -> "**selected**"
   * If no text selected: inserts "**텍스트**" and selects the placeholder text.
   */
  const handleInsertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = selectionRangeRef.current.start !== undefined ? selectionRangeRef.current.start : textarea.selectionStart;
    const end = selectionRangeRef.current.end !== undefined ? selectionRangeRef.current.end : textarea.selectionEnd;
    
    const currentText = editProfileInfo;
    const selectedText = currentText.substring(start, end);

    // If bolding and already bolded (**text**), remove bolding (toggle)
    if (prefix === '**' && suffix === '**' && selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
      const unbolded = selectedText.slice(2, -2);
      const updated = currentText.substring(0, start) + unbolded + currentText.substring(end);
      setEditProfileInfo(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + unbolded.length);
        selectionRangeRef.current = { start, end: start + unbolded.length };
      }, 30);
      return;
    }

    const replacement = `${prefix}${selectedText || '텍스트'}${suffix}`;
    const updated = currentText.substring(0, start) + replacement + currentText.substring(end);

    setEditProfileInfo(updated);

    const newStart = start + prefix.length;
    const newEnd = newStart + (selectedText.length || (replacement.length - prefix.length - suffix.length));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newStart, newEnd);
      selectionRangeRef.current = { start: newStart, end: newEnd };
    }, 30);
  };

  const openLinkModal = (type: 'url' | 'instagram' | 'email') => {
    saveSelection();
    const textarea = textareaRef.current;
    const currentText = editProfileInfo;
    let selected = '';
    if (textarea) {
      selected = currentText.substring(textarea.selectionStart, textarea.selectionEnd);
    }

    setLinkModalType(type);
    if (type === 'instagram') {
      setLinkModalTitle(selected || 'Instagram');
      setLinkModalUrl('https://instagram.com/');
    } else if (type === 'email') {
      setLinkModalTitle(selected || '이메일 문의');
      setLinkModalUrl(selected.includes('@') ? selected : '');
    } else {
      setLinkModalTitle(selected || '웹사이트 방문');
      setLinkModalUrl('https://');
    }
    setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkModalUrl.trim()) {
      alert('URL 또는 이메일 주소를 입력해주세요.');
      return;
    }

    let finalUrl = linkModalUrl.trim();
    if (linkModalType === 'email' && !finalUrl.startsWith('mailto:')) {
      finalUrl = `mailto:${finalUrl}`;
    } else if (linkModalType !== 'email' && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.startsWith('@')) {
        finalUrl = `https://instagram.com/${finalUrl.substring(1)}`;
      } else {
        finalUrl = `https://${finalUrl}`;
      }
    }

    const title = linkModalTitle.trim() || (linkModalType === 'instagram' ? 'Instagram' : linkModalType === 'email' ? '이메일' : '링크');
    const markdownLink = `[${title}](${finalUrl})`;

    const start = selectionRangeRef.current.start;
    const end = selectionRangeRef.current.end;
    const currentText = editProfileInfo;

    const updated = currentText.substring(0, start) + markdownLink + currentText.substring(end);
    setEditProfileInfo(updated);
    setLinkModalOpen(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const pos = start + markdownLink.length;
        textareaRef.current.setSelectionRange(pos, pos);
      }
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
            사진은 압축 없이 <strong>원본 해상도 그대로</strong> 선명하게 업로드되며, 텍스트 글꼴/크기/진하기 및 <strong>인스타그램/웹링크/이메일 연결</strong>을 지원합니다.
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
            글꼴, 글자 크기, 진하기(굵기), 줄 간격, 정렬을 조절하고 인스타그램/웹사이트/이메일 링크를 삽입할 수 있습니다.
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
              
              {/* 텍스트 굵게 버튼 */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents textarea from losing selection
                  saveSelection();
                  handleInsertFormatting('**', '**');
                }}
                className="px-2.5 py-1 text-xs font-extrabold bg-gray-900 text-white rounded-md hover:bg-black shadow-xs transition-colors cursor-pointer"
                title="선택한 텍스트 굵게 강조하기 (**텍스트**)"
              >
                B 굵게
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  handleInsertFormatting('## ');
                }}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="대제목 (섹션 타이틀)"
              >
                H2 대제목
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  handleInsertFormatting('### ');
                }}
                className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="소제목 (학력, 전시회 등)"
              >
                H3 소제목
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  handleInsertFormatting('• ');
                }}
                className="px-2.5 py-1 text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="글머리 기호 목록"
              >
                • 목록 기호
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  handleInsertFormatting('> ');
                }}
                className="px-2.5 py-1 text-xs bg-white border border-gray-300 hover:border-gray-400 rounded-md text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
                title="작가 노트 / 인용구"
              >
                &quot; 작가노트
              </button>

              <div className="h-4 w-px bg-gray-300 mx-1" />

              {/* 링크 도구들 */}
              <button
                type="button"
                onClick={() => openLinkModal('url')}
                className="px-2.5 py-1 text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                title="웹사이트 링크 삽입"
              >
                <span>🔗 웹링크</span>
              </button>

              <button
                type="button"
                onClick={() => openLinkModal('instagram')}
                className="px-2.5 py-1 text-xs font-medium bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                title="인스타그램 계정/링크 삽입"
              >
                <span>📸 인스타</span>
              </button>

              <button
                type="button"
                onClick={() => openLinkModal('email')}
                className="px-2.5 py-1 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                title="이메일 주소 삽입"
              >
                <span>✉️ 이메일</span>
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                  handleInsertFormatting('\n---\n');
                }}
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
                [ 실시간 서식, 링크 및 줄바꿈 미리보기 ]
              </p>
              <FormattedProfileContent text={editProfileInfo} style={editProfileStyle} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={editProfileInfo}
              onChange={(e) => {
                setEditProfileInfo(e.target.value);
                saveSelection();
              }}
              onSelect={saveSelection}
              onKeyUp={saveSelection}
              onClick={saveSelection}
              rows={16}
              placeholder={`[예시 입력]\n## 작가 소개\n**김명진 (Kim Myeong-jin)**\n\n> "빛과 공간, 자연의 조화를 캔버스에 담아내는 작업을 이어오고 있습니다."\n\n### 학력 및 약력\n• 홍익대학교 미술대학 회화과 졸업\n• 홍익대학교 대학원 미술학 석사\n\n### 연락처 및 SNS\n• 인스타그램: [Instagram @artist_kim](https://instagram.com/artist_kim)\n• 이메일: [작가 문의 메일](mailto:artist@example.com)\n• 홈페이지: [공식 웹사이트](https://example.com)`}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-gray-800 leading-relaxed bg-white shadow-inner resize-y"
              style={{
                fontFamily: editProfileStyle.fontFamily,
                fontWeight: editProfileStyle.fontWeight,
              }}
            />
          )}
          <p className="text-[11px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
            <span>* <strong>굵게:</strong> 원하는 글자를 드래그한 뒤 [B 굵게] 버튼을 누르거나 <code className="bg-gray-100 px-1 py-0.5 rounded">**글자**</code>로 감싸면 됩니다.</span>
            <span>* <strong>웹/인스타/이메일:</strong> 상단 링크 버튼을 이용하거나 <code className="bg-gray-100 px-1 py-0.5 rounded">[표시제목](링크주소)</code> 또는 <code className="bg-gray-100 px-1 py-0.5 rounded">@계정아이디</code>를 바로 적으셔도 클릭할 수 있는 링크로 자동 변환됩니다.</span>
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

      {/* 4. 링크 삽입 모달 */}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in border border-gray-100">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {linkModalType === 'instagram' && '📸 인스타그램 링크 추가'}
                {linkModalType === 'email' && '✉️ 이메일 링크 추가'}
                {linkModalType === 'url' && '🔗 웹링크 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  화면에 표시할 텍스트
                </label>
                <input
                  type="text"
                  value={linkModalTitle}
                  onChange={(e) => setLinkModalTitle(e.target.value)}
                  placeholder={
                    linkModalType === 'instagram'
                      ? '예: Instagram @my_account'
                      : linkModalType === 'email'
                      ? '예: 작가 이메일 문의'
                      : '예: 공식 웹사이트'
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {linkModalType === 'instagram' && '인스타그램 계정 또는 프로필 URL'}
                  {linkModalType === 'email' && '이메일 주소'}
                  {linkModalType === 'url' && '웹사이트 URL 주소'}
                </label>
                <input
                  type="text"
                  value={linkModalUrl}
                  onChange={(e) => setLinkModalUrl(e.target.value)}
                  placeholder={
                    linkModalType === 'instagram'
                      ? 'https://instagram.com/아이디 또는 @아이디'
                      : linkModalType === 'email'
                      ? 'artist@example.com'
                      : 'https://example.com'
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApplyLink}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                본문에 삽입하기
              </button>
            </div>
          </div>
        </div>
      )}
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

          {/* 텍스트 영역 (번역 시 줄바꿈 유지 구조 & 클릭 가능한 링크 지원) */}
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
