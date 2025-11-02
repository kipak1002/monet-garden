// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import type { Artwork } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL 및 Anon Key가 필요합니다. .env 파일을 확인해주세요.");
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