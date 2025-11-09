// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// --- 로컬 개발 환경을 위한 임시 수정 ---
// .env.local 파일 로딩 문제로 인해 하얀 화면이 계속 나타나는 문제를 해결하기 위해,
// 임시로 Supabase 키를 여기에 직접 입력합니다.
// 경고: 이 파일, 특히 이 키가 포함된 부분은 절대로 GitHub에 커밋해서는 안 됩니다!
const supabaseUrl = "https://ioqdcanherselnlledcn.supabase.co";
const supabaseAnonKey = "여기에_님_수파베이eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRjYW5oZXJzZWxubGxlZGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjEzMzAsImV4cCI6MjA3NzYzNzMzMH0.t9Myq6ZvlckSBx7aKlsjqru-Cu6VjPhgTNg_KjvT3w4";


// 원래 코드 (나중에 복구할 수 있도록 주석 처리)
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("여기에")) {
  // 이 부분은 이제 실행될 일이 거의 없지만, 안전을 위해 남겨둡니다.
  throw new Error("Supabase URL 및 Anon Key가 필요합니다. services/supabaseClient.ts 파일을 열어 직접 입력해주세요.");
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