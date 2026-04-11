import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import type { InitializeSetupPayload, UpdateInstanceSettingsPayload } from '@/services/admin.service';

// ── Query keys ──────────────────────────────────────────────────────────────
export const adminKeys = {
  setupStatus: ['admin', 'setup-status'] as const,
  branding: ['admin', 'branding'] as const,
  instanceSettings: ['admin', 'instance-settings'] as const,
  health: ['admin', 'health'] as const,
  users: (page: number, limit: number) => ['admin', 'users', page, limit] as const,
};

// ── Setup ────────────────────────────────────────────────────────────────────
export function useSetupStatus() {
  return useQuery({
    queryKey: adminKeys.setupStatus,
    queryFn: adminService.getSetupStatus,
    staleTime: 1000 * 60, // 1 min
  });
}

export function useBranding() {
  return useQuery({
    queryKey: adminKeys.branding,
    queryFn: adminService.getBranding,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useInitializeSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InitializeSetupPayload) => adminService.initializeSetup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.setupStatus });
      queryClient.invalidateQueries({ queryKey: adminKeys.branding });
    },
  });
}

// ── Admin Settings ────────────────────────────────────────────────────────────
export function useInstanceSettings() {
  return useQuery({
    queryKey: adminKeys.instanceSettings,
    queryFn: adminService.getInstanceSettings,
  });
}

export function useUpdateInstanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInstanceSettingsPayload) =>
      adminService.updateInstanceSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminKeys.instanceSettings, updated);
      queryClient.invalidateQueries({ queryKey: adminKeys.branding });
    },
  });
}

// ── Health ────────────────────────────────────────────────────────────────────
export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.health,
    queryFn: adminService.getHealth,
    refetchInterval: 30_000, // poll every 30s
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function useAdminUsers(page = 1, limit = 25) {
  return useQuery({
    queryKey: adminKeys.users(page, limit),
    queryFn: () => adminService.listUsers(page, limit),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: { systemRole?: 'SYSTEM_ADMIN' | 'USER'; isDisabled?: boolean };
    }) => adminService.updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
