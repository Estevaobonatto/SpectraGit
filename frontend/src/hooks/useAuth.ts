import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';

export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await usersService.me();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl' | 'location' | 'website'>>) =>
      usersService.updateMe(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(['me'], user);
    },
  });
}

export function useUserByUsername(username: string) {
  return useQuery({
    queryKey: ['users', username],
    queryFn: () => usersService.getByUsername(username),
    enabled: !!username,
  });
}

export function useSSHKeys() {
  return useQuery({
    queryKey: ['ssh-keys'],
    queryFn: () => usersService.listSSHKeys(),
  });
}

export function useAddSSHKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; publicKey: string }) => usersService.addSSHKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssh-keys'] });
    },
  });
}

export function useDeleteSSHKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.deleteSSHKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ssh-keys'] });
    },
  });
}
