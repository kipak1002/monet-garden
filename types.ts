export interface Artwork {
  id: number;
  created_at: string;
  title: string;
  artist: string;
  year: number;
  image_url: string;
  size: string;
  memo?: string | null;
}