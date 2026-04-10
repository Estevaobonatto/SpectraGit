import { api } from './api';

export interface PersonalAccessToken {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateTokenResponse extends PersonalAccessToken {
  token: string; // Full token, shown only once
}

export const tokensService = {
  list: async (): Promise<PersonalAccessToken[]> => {
    const { data } = await api.get('/user/tokens');
    return data.data ?? data;
  },

  create: async (body: {
    name: string;
    scopes?: string[];
    expiresAt?: string;
  }): Promise<CreateTokenResponse> => {
    const { data } = await api.post('/user/tokens', body);
    return data.data ?? data;
  },

  revoke: async (tokenId: string): Promise<void> => {
    await api.delete(`/user/tokens/${tokenId}`);
  },
};
