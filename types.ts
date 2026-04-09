
export interface Artwork {
  id: number;
  created_at: string;
  title: string;
  title_en?: string | null;
  artist: string;
  year: number;
  image_urls: string[];
  size: string;
  memo?: string | null;
  display_order?: number;
}

export interface Inquiry {
  id: number;
  created_at: string;
  name: string;
  email: string;
  type: 'Commission' | 'Exhibition' | 'Collaboration' | 'Purchase' | 'Other';
  message: string;
}

export interface Exhibition {
  id: number;
  created_at: string;
  title: string;
  image_urls: string[];
  description?: string | null;
  display_order: number;
}

export interface ImaginationArtwork {
  id: number;
  created_at: string;
  title: string;
  video_url: string;
  original_image_url: string;
  size: string;
  year: number;
  display_order: number;
}
