import { api } from './api';
import type {
  UserProfile,
  PublicUserProfile,
  ProfileSection,
  SocialLink,
  UserSkill,
  ProfileProject,
  PinnedRepository,
  LanguageStat,
  CommitHeatmapData,
} from '@/types';

export const profileService = {
  // ── Public ───────────────────────────────────────────────

  getPublicProfile: (username: string) =>
    api.get<{ data: PublicUserProfile }>(`/users/${username}/profile`).then((r) => r.data.data),

  getLanguageStats: (username: string) =>
    api.get<{ data: { languages: LanguageStat[]; totalRepos: number } }>(`/users/${username}/languages`).then((r) => r.data.data),

  getCommitHeatmap: (username: string) =>
    api.get<{ data: CommitHeatmapData }>(`/users/${username}/heatmap`).then((r) => r.data.data),

  // ── My Profile ───────────────────────────────────────────

  getMyProfile: () =>
    api.get<{ data: UserProfile }>('/me/profile').then((r) => r.data.data),

  updateCustomization: (data: {
    readmeContent?: string;
    aboutMe?: string;
    backgroundType?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    customCss?: string;
    commitChartColor?: string;
    commitChartStyle?: string;
  }) => api.put<{ data: UserProfile }>('/me/profile', data).then((r) => r.data.data),

  // ── Sections ─────────────────────────────────────────────

  createSection: (data: { title: string; content: string; sortOrder?: number; isVisible?: boolean }) =>
    api.post<{ data: ProfileSection }>('/me/profile/sections', data).then((r) => r.data.data),

  updateSection: (id: string, data: Partial<{ title: string; content: string; sortOrder: number; isVisible: boolean }>) =>
    api.put<{ data: ProfileSection }>(`/me/profile/sections/${id}`, data).then((r) => r.data.data),

  deleteSection: (id: string) =>
    api.delete(`/me/profile/sections/${id}`),

  // ── Social Links ─────────────────────────────────────────

  createSocialLink: (data: { platform: string; label: string; url: string; sortOrder?: number }) =>
    api.post<{ data: SocialLink }>('/me/profile/social-links', data).then((r) => r.data.data),

  updateSocialLink: (id: string, data: Partial<{ platform: string; label: string; url: string; sortOrder: number }>) =>
    api.put<{ data: SocialLink }>(`/me/profile/social-links/${id}`, data).then((r) => r.data.data),

  deleteSocialLink: (id: string) =>
    api.delete(`/me/profile/social-links/${id}`),

  // ── Pinned Repos ─────────────────────────────────────────

  pinRepository: (data: { repositoryId: string; sortOrder?: number }) =>
    api.post<{ data: PinnedRepository }>('/me/profile/pinned-repos', data).then((r) => r.data.data),

  unpinRepository: (repositoryId: string) =>
    api.delete(`/me/profile/pinned-repos/${repositoryId}`),

  // ── Skills ───────────────────────────────────────────────

  createSkill: (data: { name: string; proficiency?: number; relatedProjects?: string[]; sortOrder?: number }) =>
    api.post<{ data: UserSkill }>('/me/profile/skills', data).then((r) => r.data.data),

  updateSkill: (id: string, data: Partial<{ name: string; proficiency: number; relatedProjects: string[]; sortOrder: number }>) =>
    api.put<{ data: UserSkill }>(`/me/profile/skills/${id}`, data).then((r) => r.data.data),

  deleteSkill: (id: string) =>
    api.delete(`/me/profile/skills/${id}`),

  // ── Projects ─────────────────────────────────────────────

  createProject: (data: { name: string; description?: string; repoUrl?: string; liveUrl?: string; sortOrder?: number }) =>
    api.post<{ data: ProfileProject }>('/me/profile/projects', data).then((r) => r.data.data),

  updateProject: (id: string, data: Partial<{ name: string; description: string; repoUrl: string; liveUrl: string; sortOrder: number }>) =>
    api.put<{ data: ProfileProject }>(`/me/profile/projects/${id}`, data).then((r) => r.data.data),

  deleteProject: (id: string) =>
    api.delete(`/me/profile/projects/${id}`),
};
