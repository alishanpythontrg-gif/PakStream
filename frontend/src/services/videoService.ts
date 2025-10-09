import { Video, VideoUploadData, VideoResponse, VideosResponse, VideoStatus } from '../types/video';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class VideoService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async uploadVideo(videoFile: File, uploadData: VideoUploadData): Promise<VideoResponse> {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    formData.append('tags', uploadData.tags);

    return this.request<VideoResponse>('/videos/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getVideos(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<VideosResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/videos?${queryString}` : '/videos';
    
    return this.request<VideosResponse>(endpoint);
  }

  async getFeaturedVideos(limit: number = 1): Promise<VideosResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());
    
    return this.request<VideosResponse>(`/videos/featured/list?${queryParams.toString()}`);
  }

  async getVideo(id: string): Promise<VideoResponse> {
    return this.request<VideoResponse>(`/videos/${id}`);
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<VideoResponse> {
    return this.request<VideoResponse>(`/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  }

  async deleteVideo(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/videos/${id}`, {
      method: 'DELETE',
    });
  }

  async getVideoStatus(id: string): Promise<{ success: boolean; data: VideoStatus }> {
    return this.request<{ success: boolean; data: VideoStatus }>(`/videos/${id}/status`);
  }

  getVideoUrl(video: Video, quality: string = '360p'): string {
    if (video.status !== 'ready' || !video.processedFiles?.hls) {
      return '';
    }

    const variant = video.processedFiles.hls.variants.find(v => v.resolution === quality);
    if (!variant) {
      return '';
    }

    return `${API_BASE_URL.replace('/api', '')}/uploads/videos/processed/${video._id}/hls/${variant.playlist}`;
  }

  getMasterPlaylistUrl(video: Video): string {
    if (video.status !== 'ready' || !video.processedFiles?.hls?.masterPlaylist) {
      return '';
    }

    return `${API_BASE_URL.replace('/api', '')}/uploads/videos/processed/${video._id}/hls/${video.processedFiles.hls.masterPlaylist}`;
  }

  getThumbnailUrl(video: Video, index: number = 0): string {
    if (!video.processedFiles?.thumbnails || !video.processedFiles.thumbnails[index]) {
      return '';
    }

    return `${API_BASE_URL.replace('/api', '')}/uploads/videos/processed/${video._id}/hls/${video.processedFiles.thumbnails[index]}`;
  }

  getPosterUrl(video: Video): string {
    if (!video.processedFiles?.poster) {
      return this.getThumbnailUrl(video, 0);
    }

    return `${API_BASE_URL.replace('/api', '')}/uploads/videos/processed/${video._id}/hls/${video.processedFiles.poster}`;
  }

  getOriginalVideoUrl(video: Video): string {
    if (!video.originalFile?.path) {
      return '';
    }

    return `${API_BASE_URL.replace('/api', '')}/api/videos/${video._id}/original`;
  }
}

export default new VideoService();
