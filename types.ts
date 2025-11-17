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

export interface Exhibition {
  id: number;
  created_at: string;
  title: string;
  image_urls: string[];
  description?: string | null;
  display_order: number;
}