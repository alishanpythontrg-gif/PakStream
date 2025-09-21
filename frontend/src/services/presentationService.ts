import { Presentation, CreatePresentationData, PresentationResponse, SinglePresentationResponse, SlidesResponse } from '../types/presentation';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class PresentationService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');

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
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('PresentationService API request failed:', error);
      throw error;
    }
  }

  async getPresentations(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}): Promise<PresentationResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/presentations${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PresentationResponse>(endpoint);
  }

  async getPresentationById(id: string): Promise<SinglePresentationResponse> {
    return this.request<SinglePresentationResponse>(`/presentations/${id}`);
  }

  async getPresentationSlides(id: string): Promise<SlidesResponse> {
    return this.request<SlidesResponse>(`/presentations/${id}/slides`);
  }

  async uploadPresentation(formData: FormData): Promise<{ message: string; presentation: any }> {
    const url = `${API_BASE_URL}/presentations/upload`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('PresentationService upload failed:', error);
      throw error;
    }
  }

  async getAdminPresentations(): Promise<{ presentations: Presentation[] }> {
    return this.request<{ presentations: Presentation[] }>('/presentations/admin/all');
  }

  async updatePresentation(id: string, data: Partial<CreatePresentationData>): Promise<SinglePresentationResponse> {
    return this.request<SinglePresentationResponse>(`/presentations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePresentation(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/presentations/${id}`, {
      method: 'DELETE',
    });
  }

  getImageUrl(presentationId: string, slideNumber: number): string {
    return `${API_BASE_URL.replace('/api', '')}/uploads/presentations/processed/${presentationId}/slides/slide_${slideNumber}.jpg`;
  }

  getThumbnailUrl(presentationId: string): string {
    return `${API_BASE_URL.replace('/api', '')}/uploads/presentations/processed/${presentationId}/thumbnail.jpg`;
  }

  getSlideThumbnailUrl(presentationId: string, slideNumber: number): string {
    return `${API_BASE_URL.replace('/api', '')}/uploads/presentations/processed/${presentationId}/thumbnails/thumb_slide_${slideNumber}.jpg`;
  }
}

const presentationService = new PresentationService();
export default presentationService;
