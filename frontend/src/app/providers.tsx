import { useEffect } from 'react';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/stores/auth.store';
import { usersService } from '@/services/auth.service';
import { adminService } from '@/services/admin.service';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated, setTokens, setUser, setInitialized, logout } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      // Token in memory — validate it and refresh user data.
      usersService
        .me()
        .then((user) => { setUser(user); setInitialized(); })
        .catch(() => { logout(); });
    } else if (isAuthenticated) {
      // isAuthenticated persisted in localStorage but accessToken lost (page refresh).
      // Attempt a cookie-based silent refresh before giving up.
      axios
        .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
        .then(({ data }) => {
          setTokens(data.data.accessToken, data.data.refreshToken ?? '');
          return usersService.me();
        })
        .then((user) => { setUser(user); setInitialized(); })
        .catch(() => { logout(); setInitialized(); });
    } else {
      setInitialized();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

/** Fetches branding on first load and applies the primary color as a CSS variable. */
function BrandingInjector({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    adminService.getBranding().then((branding) => {
      if (branding.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
      }
    }).catch(() => {
      // Non-critical — ignore if branding endpoint is unavailable (setup not done yet).
    });
  }, []);

  return <>{children}</>;
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandingInjector>
        <AuthInitializer>
          <RouterProvider router={router} />
        </AuthInitializer>
      </BrandingInjector>
    </QueryClientProvider>
  );
}
