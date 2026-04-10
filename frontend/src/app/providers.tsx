import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/stores/auth.store';
import { usersService } from '@/services/auth.service';

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

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
