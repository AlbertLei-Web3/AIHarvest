export interface AIModel {
  id: string;
  name: string;
  description: string;
  version: string;
  creator: string;
  price: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  rating?: number;
  downloadsCount?: number;
  createdAt: string;
}

export interface HarvestRequest {
  modelId: string;
  prompt: string;
  settings?: Record<string, any>;
}

export interface HarvestResponse {
  id: string;
  modelId: string;
  prompt: string;
  result: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
}

export interface UserProfile {
  address: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  createdModels: string[];
  purchasedModels: string[];
}

export interface Web3State {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  provider: any;
  signer: any;
} 