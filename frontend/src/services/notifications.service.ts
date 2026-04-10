import { api } from './api';
import type { Notification } from '@/types';

export const notificationsService = {
  list: (params?: { page?: number; limit?: number }) =>
    api
      .get<{ data: Notification[]; meta: { total: number } }>('/notifications', { params })
      .then((r) => r.data),

  unreadCount: () =>
    api.get<{ data: { count: number } }>('/notifications/unread-count').then((r) => r.data.data.count),

  markRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllRead: () => api.post('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};
