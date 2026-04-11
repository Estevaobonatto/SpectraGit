import { api } from './api';
import type { Collaborator, CollaboratorSearchUser, RepoRole, Repository } from '@/types';

export const collaboratorsService = {
  list: (owner: string, repo: string) =>
    api.get<{ data: Collaborator[] }>(`/repos/${owner}/${repo}/collaborators`).then((r) => r.data.data),

  add: (owner: string, repo: string, data: { username: string; role?: RepoRole }) =>
    api.post<{ data: Collaborator }>(`/repos/${owner}/${repo}/collaborators`, data).then((r) => r.data.data),

  updateRole: (owner: string, repo: string, username: string, role: RepoRole) =>
    api.put<{ data: Collaborator }>(`/repos/${owner}/${repo}/collaborators/${username}`, { role }).then((r) => r.data.data),

  remove: (owner: string, repo: string, username: string) =>
    api.delete(`/repos/${owner}/${repo}/collaborators/${username}`),

  searchUsers: (owner: string, repo: string, query: string) =>
    api.get<{ data: CollaboratorSearchUser[] }>(`/repos/${owner}/${repo}/collaborators/search`, { params: { q: query } }).then((r) => r.data.data),

  listOrgMembers: (owner: string, repo: string, orgName: string) =>
    api.get<{ data: CollaboratorSearchUser[] }>(`/repos/${owner}/${repo}/collaborators/org-members/${orgName}`).then((r) => r.data.data),

  listCollaboratedRepos: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: { items: (Repository & { collaboratorRole: RepoRole; collaboratorSince: string })[]; total: number; page: number; totalPages: number } }>('/user/collaborated-repos', { params }).then((r) => r.data.data),
};
