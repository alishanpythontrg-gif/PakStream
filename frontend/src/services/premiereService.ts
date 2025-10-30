import { Premiere, PremiereResponse, PremieresResponse, CreatePremiereData } from '../types/premiere';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PremiereService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    console.log('PremiereService request:', { url, token: token ? 'Present' : 'Missing' });
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('PremiereService error:', { status: response.status, data });
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('PremiereService API request failed:', error);
      throw error;
    }
  }

  // Public method for getting active premiere (no auth required)
  private async publicRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('PremiereService public request:', { url });
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('PremiereService public error:', { status: response.status, data });
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('PremiereService public API request failed:', error);
      throw error;
    }
  }

  async createPremiere(premiereData: CreatePremiereData): Promise<PremiereResponse> {
    console.log('Creating premiere with data:', premiereData);
    return this.request<PremiereResponse>('/premieres', {
      method: 'POST',
      body: JSON.stringify(premiereData),
    });
  }

  async getAllPremieres(): Promise<PremieresResponse> {
    return this.request<PremieresResponse>('/premieres');
  }

  // Public method - no authentication required
  async getActivePremiere(): Promise<PremiereResponse> {
    return this.publicRequest<PremiereResponse>('/premieres/active');
  }

  // Public method - get upcoming premieres (no auth required)
  async getUpcomingPremieres(): Promise<PremieresResponse> {
    return this.publicRequest<PremieresResponse>('/premieres/upcoming');
  }

  async getPremiereById(premiereId: string): Promise<PremiereResponse> {
    return this.request<PremiereResponse>(`/premieres/${premiereId}`);
  }

  async updatePremiere(premiereId: string, updateData: Partial<CreatePremiereData>): Promise<PremiereResponse> {
    return this.request<PremiereResponse>(`/premieres/${premiereId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deletePremiere(premiereId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/premieres/${premiereId}`, {
      method: 'DELETE',
    });
  }

  async joinPremiere(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/premieres/join', {
      method: 'POST',
    });
  }

  async endPremiere(premiereId: string): Promise<PremiereResponse> {
    return this.request<PremiereResponse>(`/premieres/${premiereId}/end`, {
      method: 'POST',
    });
  }

  isPremiereLive(premiere: Premiere): boolean {
    const now = new Date();
    const startTime = new Date(premiere.startTime);
    const endTime = new Date(premiere.endTime);
    
    return now >= startTime && now <= endTime && premiere.status === 'live';
  }

  isPremiereScheduled(premiere: Premiere): boolean {
    const now = new Date();
    const startTime = new Date(premiere.startTime);
    
    return now < startTime && premiere.status === 'scheduled';
  }

  getTimeUntilStart(startTime: string): number {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    return Math.max(0, start - now);
  }

  getTimeUntilEnd(endTime: string): number {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    return Math.max(0, end - now);
  }

  // Utility method to get poster URL
  getPosterUrl(video: any): string {
    if (!video.processedFiles?.poster) {
      return '';
    }
    return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/videos/${video._id}/hls/${video.processedFiles.poster}`;
  }
}

export default new PremiereService();
