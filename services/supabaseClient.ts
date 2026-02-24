// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Supabase 접속 정보는 .env.local 파일에서 안전하게 불러옵니다.
// ... (existing comments)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ... (existing debug code)

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
 * Compresses an image file.
 * @param file - The image file to compress.
 * @returns A compressed Blob.
 */
async function compressImageFile(file: File | Blob): Promise<File | Blob> {
    const options = {
        maxSizeMB: 0.8,           // Target size under 800KB
        maxWidthOrHeight: 1600, // Slightly smaller max dimension for better compression
        useWebWorker: true,
        fileType: 'image/webp', // Force webp
        initialQuality: 0.7,    // Start with 70% quality
        alwaysKeepResolution: false // Allow resolution reduction to meet size target
    };
    try {
        console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        const compressedFile = await imageCompression(file as File, options);
        console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
        return compressedFile;
    } catch (error) {
        console.error("Image compression error:", error);
        return file; // Return original if compression fails
    }
}

/**
 * Uploads an image file or a data URL to Supabase Storage.
 * @param file - The image file (as a File object or a data URL string).
 * @returns The public URL of the uploaded image.
 */
export async function uploadImage(file: File | string): Promise<string> {
    let fileToProcess = typeof file === 'string' ? await dataUrlToBlob(file) : file;
    
    // Compress the image before uploading
    const compressedBlob = await compressImageFile(fileToProcess);
    const fileToUpload = compressedBlob;

    let fileExt = 'webp'; // Default to webp since we compress to it
    if (fileToUpload instanceof File && fileToUpload.name) {
        const nameParts = fileToUpload.name.split('.');
        if (nameParts.length > 1) {
            fileExt = nameParts.pop() || 'webp';
        }
    } else if (fileToUpload.type) {
        const typeParts = fileToUpload.type.split('/');
        if (typeParts.length === 2) {
            fileExt = typeParts[1];
        }
    }
    
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}_${randomString}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(filePath, fileToUpload, {
            contentType: fileToUpload.type || 'image/webp',
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);
    
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