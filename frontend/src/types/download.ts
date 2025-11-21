export interface VideoDownload {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  video: {
    _id: string;
    title: string;
    description?: string;
  };
  downloadedAt: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadStats {
  totalDownloads: number;
  downloadsPerVideo: Array<{
    videoId: string;
    videoTitle: string;
    downloadCount: number;
  }>;
  downloadsPerUser: Array<{
    userId: string;
    username: string;
    email: string;
    downloadCount: number;
  }>;
  downloadsOverTime: Array<{
    date: string;
    count: number;
  }>;
}

export interface DownloadsResponse {
  success: boolean;
  data: {
    downloads: VideoDownload[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit?: number;
    };
  };
}

export interface DownloadStatsResponse {
  success: boolean;
  data: DownloadStats;
}

