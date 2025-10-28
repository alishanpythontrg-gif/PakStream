export interface EdgeServer {
  _id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey: string;
  status: 'active' | 'inactive' | 'error';
  lastHeartbeat: string;
  capacity?: {
    storage: number;
    bandwidth: number;
  };
  location?: {
    region: string;
    datacenter: string;
  };
  stats?: {
    videosSynced: number;
    lastSyncTime: string;
    syncErrors: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEdgeServerData {
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  apiKey: string;
  capacity?: {
    storage: number;
    bandwidth: number;
  };
  location?: {
    region: string;
    datacenter: string;
  };
}

export interface EdgeServersResponse {
  success: boolean;
  data: {
    servers: EdgeServer[];
  };
}

export interface EdgeServerResponse {
  success: boolean;
  data: {
    edgeServer: EdgeServer;
  };
}

