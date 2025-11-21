import { Document, DocumentUploadData, DocumentsResponse, DocumentResponse } from '../types/document';
import { API_BASE_URL, getBaseUrl } from '../config/api';

class DocumentService {
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
      console.error('DocumentService API request failed:', error);
      throw error;
    }
  }

  async getDocuments(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}): Promise<DocumentsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DocumentsResponse>(endpoint);
  }

  async getDocumentById(id: string): Promise<DocumentResponse> {
    return this.request<DocumentResponse>(`/documents/${id}`);
  }

  async uploadDocument(file: File, uploadData: DocumentUploadData): Promise<{ message: string; document: any }> {
    const url = `${API_BASE_URL}/documents/upload`;
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    formData.append('tags', uploadData.tags);

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
      console.error('DocumentService upload failed:', error);
      throw error;
    }
  }

  async getAdminDocuments(): Promise<{ documents: Document[] }> {
    return this.request<{ documents: Document[] }>('/documents/admin/all');
  }

  async updateDocument(id: string, data: Partial<DocumentUploadData>): Promise<DocumentResponse> {
    return this.request<DocumentResponse>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  getDocumentFileUrl(id: string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/api/documents/${id}/file`;
  }

  getDocumentDownloadUrl(id: string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/api/documents/${id}/file?download=true`;
  }

  getThumbnailUrl(id: string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/api/documents/${id}/thumbnail`;
  }
}

const documentService = new DocumentService();
export default documentService;

