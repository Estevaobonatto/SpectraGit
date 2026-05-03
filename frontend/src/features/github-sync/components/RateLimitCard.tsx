import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { integrationsService } from '@/services/integrations.service';

interface RateLimitCardProps {
  enabled?: boolean;
}

export default function RateLimitCard({ enabled = true }: RateLimitCardProps) {
  const { data: rateLimit, isLoading: rateLimitLoading } = useQuery({
    queryKey: ['github-rate-limit'],
    queryFn: () => integrationsService.getRateLimit(),
    enabled,
    refetchInterval: enabled ? 30000 : false,
    retry: false,
  });

  const { data: tokenHealth, isLoading: tokenHealthLoading } = useQuery({
    queryKey: ['github-token-health'],
    queryFn: () => integrationsService.checkTokenHealth(),
    enabled,
    refetchInterval: enabled ? 60000 : false,
    retry: false,
  });

  const isLoading = rateLimitLoading || tokenHealthLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rate Limit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            API Rate Limit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rateLimit ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Remaining</span>
                <span className={`text-sm font-semibold ${rateLimit.remaining < 100 ? 'text-destructive' : 'text-text-primary'}`}>
                  {rateLimit.remaining} / {rateLimit.limit}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rateLimit.remaining < 100 ? 'bg-destructive' : rateLimit.remaining < 500 ? 'bg-warning' : 'bg-success'
                  }`}
                  style={{ width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` }}
                />
              </div>
              {rateLimit.resetAt && (
                <div className="flex items-center gap-1 text-xs text-text-tertiary">
                  <Clock className="h-3 w-3" />
                  Resets at {new Date(rateLimit.resetAt).toLocaleTimeString()}
                  {rateLimit.resetInSeconds > 0 && ` (${Math.ceil(rateLimit.resetInSeconds / 60)}m)`}
                </div>
              )}
              {!rateLimit.isHealthy && (
                <div className="flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Rate limit is low. Consider waiting before making more requests.
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-text-tertiary">Unable to fetch rate limit status.</p>
          )}
        </CardContent>
      </Card>

      {/* Token Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {tokenHealth?.valid ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            Token Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tokenHealth ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={tokenHealth.valid ? 'success' : 'destructive'}>
                  {tokenHealth.valid ? 'Valid' : 'Invalid'}
                </Badge>
                {tokenHealth.expiresAt && (
                  <span className="text-xs text-text-tertiary">
                    Expires {new Date(tokenHealth.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {tokenHealth.scopes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tokenHealth.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary" className="text-[10px]">
                      {scope}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-text-tertiary">Unable to check token health.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
