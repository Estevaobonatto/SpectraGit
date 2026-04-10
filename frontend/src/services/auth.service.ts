import { api } from './api';
import type { User, SSHKey } from '@/types';

export const authService = {
  refresh: (refreshToken: string) =>
    api.post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),
};

export const usersService = {
  me: () => api.get<{ data: User }>('/me').then((r) => r.data.data),

  updateMe: (data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>) =>
    api.put<{ data: User }>('/me', data).then((r) => r.data.data),

  getByUsername: (username: string) =>
    api.get<{ data: User }>(`/users/${username}`).then((r) => r.data.data),

  search: (q: string, limit = 10) =>
    api.get<{ data: User[] }>('/users/search', { params: { q, limit } }).then((r) => r.data.data),

  listSSHKeys: () =>
    api.get<{ data: SSHKey[] }>('/me/ssh-keys').then((r) => r.data.data),

  addSSHKey: (data: { title: string; publicKey: string }) =>
    api.post<{ data: SSHKey }>('/me/ssh-keys', data).then((r) => r.data.data),

  deleteSSHKey: (id: string) => api.delete(`/me/ssh-keys/${id}`),
};
