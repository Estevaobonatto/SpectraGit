import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/stores/auth.store';
import { usersService } from '@/services/auth.service';
import { adminService } from '@/services/admin.service';

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
  const { accessToken, setUser, setInitialized, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      setInitialized();
      return;
    }
    // Silently validate token and restore fresh user data.
    // The axios interceptor handles 401 → auto-refresh transparently.
    usersService
      .me()
      .then((user) => {
        setUser(user);
        setInitialized();
      })
      .catch(() => {
        // Both access and refresh tokens failed — force logout.
        logout();
      });
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
