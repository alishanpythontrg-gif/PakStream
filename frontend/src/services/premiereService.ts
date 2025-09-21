import { Premiere, PremiereResponse, PremieresResponse, CreatePremiereData } from '../types/premiere';
import videoService from './videoService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PremiereService {
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

  async createPremiere(premiereData: CreatePremiereData): Promise<PremiereResponse> {
    return this.request<PremiereResponse>('/premieres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(premiereData),
    });
  }

  async getActivePremiere(): Promise<PremiereResponse> {
    return this.request<PremiereResponse>('/premieres/active');
  }

  async getAllPremieres(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<PremieresResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/premieres?${queryString}` : '/premieres';

    return this.request<PremieresResponse>(endpoint);
  }

  async joinPremiere(): Promise<PremiereResponse> {
    return this.request<PremiereResponse>('/premieres/join', {
      method: 'POST',
    });
  }

  async endPremiere(premiereId: string): Promise<PremiereResponse> {
    return this.request<PremiereResponse>(`/premieres/${premiereId}/end`, {
      method: 'POST',
    });
  }

  async updatePremiere(premiereId: string, updateData: Partial<CreatePremiereData>): Promise<PremiereResponse> {
    return this.request<PremiereResponse>(`/premieres/${premiereId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  }

  async deletePremiere(premiereId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/premieres/${premiereId}`, {
      method: 'DELETE',
    });
  }

  // Helper methods
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

  isPremiereLive(premiere: Premiere): boolean {
    const now = new Date();
    const start = new Date(premiere.startTime);
    const end = new Date(premiere.endTime);
    return now >= start && now <= end && premiere.status === 'live';
  }

  isPremiereScheduled(premiere: Premiere): boolean {
    const now = new Date();
    const start = new Date(premiere.startTime);
    return now < start && premiere.status === 'scheduled';
  }

  formatTimeRemaining(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Delegate to videoService for video-related methods
  getPosterUrl(video: any): string {
    return videoService.getPosterUrl(video);
  }
}

export default new PremiereService();
