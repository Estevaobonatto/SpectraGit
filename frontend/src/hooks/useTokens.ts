import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tokensService } from '@/services/tokens.service';

export function useTokens() {
  return useQuery({
    queryKey: ['tokens'],
    queryFn: () => tokensService.list(),
  });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; scopes?: string[]; expiresAt?: string }) =>
      tokensService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens'] }),
  });
}

export function useRevokeToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => tokensService.revoke(tokenId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens'] }),
  });
}
