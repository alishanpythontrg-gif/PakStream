export interface Premiere {
  _id: string;
  video: {
    _id: string;
    title: string;
    description: string;
    duration: number;
    resolution: string;
    processedFiles: {
      hls: {
        masterPlaylist: string;
        variants: Array<{
          resolution: string;
          bitrate: number;
          playlist: string;
          segments: string[];
        }>;
      };
      thumbnails: string[];
      poster: string;
    };
  };
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'live' | 'ended';
  createdBy: {
    _id: string;
    username: string;
  };
  viewers: Array<{
    user: string;
    joinedAt: string;
  }>;
  totalViewers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PremiereResponse {
  success: boolean;
  message: string;
  data: {
    premiere: Premiere;
  };
}

export interface PremieresResponse {
  success: boolean;
  data: {
    premieres: Premiere[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  };
}

export interface CreatePremiereData {
  videoId: string;
  title: string;
  description: string;
  startTime?: string;
  duration?: number;
}
