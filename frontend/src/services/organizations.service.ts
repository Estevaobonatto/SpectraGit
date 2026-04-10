import { api } from './api';
import type { Organization, OrganizationMember, Team } from '@/types';

export const organizationsService = {
  create: (data: { name: string; displayName?: string; description?: string }) =>
    api.post<{ data: Organization }>('/orgs', data).then((r) => r.data.data),

  get: (name: string) =>
    api.get<{ data: Organization }>(`/orgs/${name}`).then((r) => r.data.data),

  update: (name: string, data: Partial<Organization>) =>
    api.put<{ data: Organization }>(`/orgs/${name}`, data).then((r) => r.data.data),

  delete: (name: string) => api.delete(`/orgs/${name}`),

  myMemberships: () =>
    api.get<{ data: OrganizationMember[] }>('/orgs/user/memberships').then((r) => r.data.data),

  inviteMember: (name: string, data: { username: string; role?: string }) =>
    api.post(`/orgs/${name}/members`, data),

  listMembers: (name: string) =>
    api.get<{ data: OrganizationMember[] }>(`/orgs/${name}/members`).then((r) => r.data.data),

  removeMember: (name: string, username: string) =>
    api.delete(`/orgs/${name}/members/${username}`),

  createTeam: (name: string, data: { name: string; description?: string }) =>
    api.post<{ data: Team }>(`/orgs/${name}/teams`, data).then((r) => r.data.data),

  listTeams: (name: string) =>
    api.get<{ data: Team[] }>(`/orgs/${name}/teams`).then((r) => r.data.data),
};
