import axios from 'axios';
import { AIModel, HarvestRequest, HarvestResponse, UserProfile } from '../types';

// Create an axios instance with common configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods
export const modelsApi = {
  getAll: async (): Promise<AIModel[]> => {
    const response = await api.get('/models');
    return response.data;
  },
  
  getById: async (id: string): Promise<AIModel> => {
    const response = await api.get(`/models/${id}`);
    return response.data;
  },
  
  create: async (model: Omit<AIModel, 'id' | 'createdAt'>): Promise<AIModel> => {
    const response = await api.post('/models', model);
    return response.data;
  }
};

export const harvestApi = {
  request: async (request: HarvestRequest): Promise<HarvestResponse> => {
    const response = await api.post('/harvest', request);
    return response.data;
  },
  
  getResults: async (id: string): Promise<HarvestResponse> => {
    const response = await api.get(`/harvest/${id}`);
    return response.data;
  }
};

export const userApi = {
  getProfile: async (address: string): Promise<UserProfile> => {
    const response = await api.get(`/users/${address}`);
    return response.data;
  },
  
  updateProfile: async (address: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await api.put(`/users/${address}`, data);
    return response.data;
  }
};

export default api; 