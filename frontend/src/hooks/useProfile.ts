import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';

// ── Public Profile ────────────────────────────────────────

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => profileService.getPublicProfile(username),
    enabled: !!username,
  });
}

export function useLanguageStats(username: string) {
  return useQuery({
    queryKey: ['languages', username],
    queryFn: () => profileService.getLanguageStats(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommitHeatmap(username: string) {
  return useQuery({
    queryKey: ['heatmap', username],
    queryFn: () => profileService.getCommitHeatmap(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

// ── My Profile ────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: () => profileService.getMyProfile(),
  });
}

export function useUpdateProfileCustomization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof profileService.updateCustomization>[0]) =>
      profileService.updateCustomization(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ── Sections ──────────────────────────────────────────────

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof profileService.createSection>[0]) =>
      profileService.createSection(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof profileService.updateSection>[1]) =>
      profileService.updateSection(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileService.deleteSection(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

// ── Social Links ──────────────────────────────────────────

export function useCreateSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof profileService.createSocialLink>[0]) =>
      profileService.createSocialLink(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useUpdateSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof profileService.updateSocialLink>[1]) =>
      profileService.updateSocialLink(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useDeleteSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileService.deleteSocialLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

// ── Pinned Repos ──────────────────────────────────────────

export function usePinRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { repositoryId: string; sortOrder?: number }) =>
      profileService.pinRepository(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useUnpinRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (repositoryId: string) => profileService.unpinRepository(repositoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

// ── Skills ────────────────────────────────────────────────

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof profileService.createSkill>[0]) =>
      profileService.createSkill(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof profileService.updateSkill>[1]) =>
      profileService.updateSkill(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileService.deleteSkill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

// ── Projects ──────────────────────────────────────────────

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof profileService.createProject>[0]) =>
      profileService.createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof profileService.updateProject>[1]) =>
      profileService.updateProject(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => profileService.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}
