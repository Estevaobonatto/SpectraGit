import { api } from './api';
import type { Notification } from '@/types';

export const notificationsService = {
  list: (params?: { page?: number; limit?: number }) =>
    api
      .get<{ data: { items: Notification[]; total: number; unreadCount: number; page: number; totalPages: number }; meta: unknown }>('/notifications', { params })
      .then((r) => ({ data: r.data.data.items, meta: { total: r.data.data.total, unreadCount: r.data.data.unreadCount } })),

  unreadCount: () =>
    api.get<{ data: { count: number } }>('/notifications/unread-count').then((r) => r.data.data.count),

  markRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllRead: () => api.post('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
};
