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
async function resizeAndConvertToWebP(file: File | Blob, maxDim: number = 1280, quality: number = 0.7): Promise<File> {
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
                    const newName = originalName.replace(/\.[^/.]+$/, "") + ".webp";
                    const newFile = new File([blob], newName, { type: 'image/webp' });
                    console.log(`[압축 완료] 원본: ${(file.size / 1024 / 1024).toFixed(2)}MB -> 결과: ${(newFile.size / 1024 / 1024).toFixed(2)}MB`);
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
    
    // 1. 먼저 라이브러리로 기본 압축 시도
    let finalFile: File;
    try {
        // 비디오 파일 등 이미지가 아닌 경우 예외 처리
        if (!fileToProcess.type.startsWith('image/')) {
            // 이미지가 아니면 압축 없이 진행 (예: 비디오)
            const randomString = Math.random().toString(36).substring(2, 8);
            const fileName = `${Date.now()}_${randomString}_original`;
            const { error: uploadError } = await supabase.storage.from('artworks').upload(fileName, fileToProcess);
            if (uploadError) throw uploadError;
            return supabase.storage.from('artworks').getPublicUrl(fileName).data.publicUrl;
        }

        // 이미지인 경우 Canvas를 사용하여 확실하게 WebP 변환 및 리사이징
        finalFile = await resizeAndConvertToWebP(fileToProcess);
    } catch (error) {
        console.error("이미지 처리 중 오류 발생, 원본 업로드 시도:", error);
        // 실패 시 원본 그대로 사용 (최후의 수단)
        if (fileToProcess instanceof File) {
            finalFile = fileToProcess;
        } else {
            finalFile = new File([fileToProcess], `upload_${Date.now()}.png`, { type: fileToProcess.type });
        }
    }

    // 파일명 생성 (무조건 .webp)
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}_${randomString}.webp`;

    const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(fileName, finalFile, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);
    
    return data.publicUrl;
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