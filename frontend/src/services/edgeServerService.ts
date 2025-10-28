import { EdgeServersResponse, EdgeServerResponse, CreateEdgeServerData } from '../types/edgeServer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class EdgeServerService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
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
      console.error('EdgeServerService API request failed:', error);
      throw error;
    }
  }

  async getEdgeServers(): Promise<EdgeServersResponse> {
    return this.request<EdgeServersResponse>('/edge/servers');
  }

  async registerEdgeServer(serverData: CreateEdgeServerData): Promise<EdgeServerResponse> {
    return this.request<EdgeServerResponse>('/edge/register', {
      method: 'POST',
      body: JSON.stringify(serverData),
    });
  }

  async updateEdgeServer(serverId: string, serverData: Partial<CreateEdgeServerData>): Promise<EdgeServerResponse> {
    return this.request<EdgeServerResponse>(`/edge/servers/${serverId}`, {
      method: 'PUT',
      body: JSON.stringify(serverData),
    });
  }

  async deleteEdgeServer(serverId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/edge/servers/${serverId}`, {
      method: 'DELETE',
    });
  }

  async syncVideo(videoId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/edge/video/${videoId}/sync`, {
      method: 'POST',
    });
  }
}

export default new EdgeServerService();

