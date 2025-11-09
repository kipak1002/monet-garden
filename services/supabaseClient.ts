// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Supabase 접속 정보는 .env.local 파일에서 안전하게 불러옵니다.
// .env.local 파일이 없거나 내용이 비어있으면 앱이 작동하지 않습니다.
// VITE_SUPABASE_URL="YOUR_URL"
// VITE_SUPABASE_ANON_KEY="YOUR_KEY"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ======================= 디버깅을 위한 임시 코드 =======================
// 이 코드는 앱이 어떤 Supabase 주소로 연결을 시도하는지 브라우저 콘솔에 보여줍니다.
console.log("현재 연결 시도 중인 Supabase URL:", supabaseUrl);
// =====================================================================

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Make sure you have a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert data URL to a Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
}

/**
 * Uploads an image file or a data URL to Supabase Storage.
 * @param file - The image file (as a File object or a data URL string).
 * @returns The public URL of the uploaded image.
 */
export async function uploadImage(file: File | string): Promise<string> {
    const fileToUpload = typeof file === 'string' ? await dataUrlToBlob(file) : file;
    // FIX: Use `instanceof File` as a type guard to safely access the `name` property.
    // The `name` property exists on `File` objects but not on plain `Blob` objects.
    // This resolves the TypeScript error by ensuring we only access `.name` when
    // `fileToUpload` is a `File`, while preserving the logic to default to 'png' for blobs.
    const fileExt = (fileToUpload instanceof File && fileToUpload.name) ? fileToUpload.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(filePath, fileToUpload);

    if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);
    
    return data.publicUrl;
}
