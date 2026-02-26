// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Supabase 접속 정보는 .env.local 파일에서 안전하게 불러옵니다.
// ... (existing comments)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ... (existing debug code)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Make sure you have a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Canvas를 사용하여 이미지를 강제로 리사이징하고 WebP로 변환합니다.
 * 라이브러리가 실패할 경우를 대비한 가장 확실한 방법입니다.
 */
async function resizeAndConvertToWebP(file: File | Blob, maxDim: number = 1280, quality: number = 0.7, suffix: string = ""): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // 리사이징 계산
            if (width > height) {
                if (width > maxDim) {
                    height *= maxDim / width;
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width *= maxDim / height;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Canvas context를 생성할 수 없습니다."));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // WebP로 변환 및 압축
            canvas.toBlob((blob) => {
                if (blob) {
                    const originalName = (file instanceof File) ? file.name : 'image.png';
                    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
                    const newName = `${nameWithoutExt}${suffix}.webp`;
                    const newFile = new File([blob], newName, { type: 'image/webp' });
                    console.log(`[압축 완료${suffix}] 원본: ${(file.size / 1024 / 1024).toFixed(2)}MB -> 결과: ${(newFile.size / 1024 / 1024).toFixed(2)}MB`);
                    resolve(newFile);
                } else {
                    reject(new Error("Canvas 변환 실패"));
                }
            }, 'image/webp', quality);
            
            // 메모리 해제
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            reject(new Error("이미지 로드 실패"));
            URL.revokeObjectURL(img.src);
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Uploads an image file or a data URL to Supabase Storage.
 * @param file - The image file (as a File object or a data URL string).
 * @returns The public URL of the uploaded image.
 */
export async function uploadImage(file: File | string): Promise<string> {
    let fileToProcess: File | Blob;
    
    if (typeof file === 'string') {
        // Data URL 처리
        const res = await fetch(file);
        fileToProcess = await res.blob();
    } else {
        fileToProcess = file;
    }
    
    // 비디오 파일 등 이미지가 아닌 경우 예외 처리
    if (!fileToProcess.type.startsWith('image/')) {
        // 이미지가 아니면 압축 없이 진행 (예: 비디오)
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `${Date.now()}_${randomString}_original`;
        const { error: uploadError } = await supabase.storage.from('artworks').upload(fileName, fileToProcess);
        if (uploadError) throw uploadError;
        return supabase.storage.from('artworks').getPublicUrl(fileName).data.publicUrl;
    }

    // 파일명 공통 베이스 생성
    const randomString = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();
    const baseName = `${timestamp}_${randomString}`;

    // 1. 메인 이미지 처리 및 업로드 (1280px, 0.7 quality)
    const mainFile = await resizeAndConvertToWebP(fileToProcess, 1280, 0.7);
    const mainFileName = `${baseName}.webp`;
    
    const { error: mainUploadError } = await supabase.storage
        .from('artworks')
        .upload(mainFileName, mainFile, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false
        });

    if (mainUploadError) {
        console.error("Main image upload error:", mainUploadError);
        throw mainUploadError;
    }

    // 2. 썸네일 이미지 처리 및 업로드 (400px, 0.5 quality) - 백그라운드에서 실행해도 되지만 안전을 위해 대기
    try {
        const thumbFile = await resizeAndConvertToWebP(fileToProcess, 400, 0.5, "_thumb");
        const thumbFileName = `${baseName}_thumb.webp`;
        
        await supabase.storage
            .from('artworks')
            .upload(thumbFileName, thumbFile, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: false
            });
    } catch (thumbError) {
        console.warn("Thumbnail generation/upload failed, but main image succeeded:", thumbError);
        // 썸네일 실패는 메인 업로드 성공을 막지 않음
    }

    const { data } = supabase.storage
        .from('artworks')
        .getPublicUrl(mainFileName);
    
    return data.publicUrl;
}

/**
 * 기존 이미지 URL로부터 썸네일을 생성하여 업로드합니다.
 * 일괄 처리를 위해 사용됩니다.
 */
export async function generateThumbnailFromUrl(url: string): Promise<boolean> {
    if (!url || !url.includes('supabase.co') || !url.endsWith('.webp') || url.includes('_thumb.webp')) {
        return false;
    }

    try {
        // 1. 이미지 데이터 가져오기
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 2. 썸네일 생성 (400px, 0.5 quality)
        const thumbFile = await resizeAndConvertToWebP(blob, 400, 0.5, "_thumb");
        
        // 3. 파일명 결정 (원본 URL에서 추출)
        const urlParts = url.split('/');
        const originalFileName = urlParts[urlParts.length - 1];
        const thumbFileName = originalFileName.replace('.webp', '_thumb.webp');
        
        // 4. 업로드
        const { error } = await supabase.storage
            .from('artworks')
            .upload(thumbFileName, thumbFile, {
                contentType: 'image/webp',
                cacheControl: '3600',
                upsert: true // 이미 있으면 덮어쓰기
            });

        if (error) throw error;
        console.log(`[썸네일 생성 완료] ${thumbFileName}`);
        return true;
    } catch (error) {
        console.error(`[썸네일 생성 실패] ${url}:`, error);
        return false;
    }
}

/**
 * Records a new visit in the visitor_logs table.
 * Uses sessionStorage to prevent counting page refreshes as new visits within the same session.
 */
export async function recordVisit() {
    const VISITED_KEY = 'has_visited_session';
    
    // If the user has already visited in this session, don't record again.
    if (sessionStorage.getItem(VISITED_KEY)) {
        return;
    }

    try {
        const { error } = await supabase.from('visitor_logs').insert({});
        if (!error) {
            sessionStorage.setItem(VISITED_KEY, 'true');
        } else {
            // If table doesn't exist (404 or 42P01), just ignore silently to not break the app
            console.warn("Visitor logging failed (Table might not exist):", error.message);
        }
    } catch (e) {
        console.error("Error recording visit:", e);
    }
}

/**
 * Gets the total count of visitors.
 */
export async function getVisitorCount(): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('visitor_logs')
            .select('*', { count: 'exact', head: true });
            
        if (error) throw error;
        return count || 0;
    } catch (e) {
        console.warn("Failed to fetch visitor count:", e);
        return 0;
    }
}