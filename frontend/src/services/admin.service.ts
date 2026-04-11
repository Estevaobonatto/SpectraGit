import { api } from './api';

export interface InstanceSettings {
  id: string;
  appName: string;
  appLogoUrl: string | null;
  primaryColor: string;
  baseUrl: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpFromEmail: string | null;
  smtpPasswordConfigured: boolean;
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInstanceSettingsPayload {
  appName?: string;
  appLogoUrl?: string;
  primaryColor?: string;
  baseUrl?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpFromEmail?: string;
  smtpPassword?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  systemRole: 'SYSTEM_ADMIN' | 'USER';
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { ownedRepos: number };
}

export interface UsersListResponse {
  users: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SystemHealth {
  status: string;
  version: string;
  uptime: number;
  memoryUsageMb: number;
  nodeVersion: string;
  platform: string;
  components: {
    database: { status: string; latencyMs: number };
    gitStorage: { status: string; path: string; accessible: boolean };
  };
}

export interface SetupStatus {
  isSetupComplete: boolean;
  hasAdminUser: boolean;
}

export interface BrandingSettings {
  appName: string;
  appLogoUrl: string | null;
  primaryColor: string;
}

export interface InitializeSetupPayload {
  appName: string;
  baseUrl: string;
  primaryColor: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export const adminService = {
  // ── Public (no auth required) ──────────────────────────────────────
  async getSetupStatus(): Promise<SetupStatus> {
    const { data } = await api.get('/setup/status');
    return data.data ?? data;
  },

  async getBranding(): Promise<BrandingSettings> {
    const { data } = await api.get('/setup/branding');
    return data.data ?? data;
  },

  async initializeSetup(payload: InitializeSetupPayload): Promise<{ message: string }> {
    const { data } = await api.post('/setup/initialize', payload);
    return data.data ?? data;
  },

  // ── Admin (requires SYSTEM_ADMIN role) ────────────────────────────
  async getInstanceSettings(): Promise<InstanceSettings> {
    const { data } = await api.get('/admin/instance/settings');
    return data.data ?? data;
  },

  async updateInstanceSettings(payload: UpdateInstanceSettingsPayload): Promise<InstanceSettings> {
    const { data } = await api.put('/admin/instance/settings', payload);
    return data.data ?? data;
  },

  async getHealth(): Promise<SystemHealth> {
    const { data } = await api.get('/admin/instance/health');
    return data.data ?? data;
  },

  async listUsers(page = 1, limit = 25): Promise<UsersListResponse> {
    const { data } = await api.get('/admin/users', { params: { page, limit } });
    return data.data ?? data;
  },

  async updateUser(
    userId: string,
    payload: { systemRole?: 'SYSTEM_ADMIN' | 'USER'; isDisabled?: boolean },
  ): Promise<AdminUser> {
    const { data } = await api.patch(`/admin/users/${userId}`, payload);
    return data.data ?? data;
  },
};
