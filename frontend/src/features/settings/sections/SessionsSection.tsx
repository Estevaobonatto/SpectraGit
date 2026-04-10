import { Monitor, Smartphone, Globe, Trash2 } from 'lucide-react';
import { useSessions, useRevokeSession, useRevokeAllSessions } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';

function parseDevice(userAgent: string | null) {
  if (!userAgent) return { label: 'Unknown device', icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone'))
    return { label: 'Mobile', icon: Smartphone };
  return { label: 'Desktop', icon: Monitor };
}

function parseBrowser(userAgent: string | null) {
  if (!userAgent) return 'Unknown browser';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  return 'Other';
}

export default function SessionsSection() {
  const { data: sessions, isLoading } = useSessions();
  const revokeMutation = useRevokeSession();
  const revokeAllMutation = useRevokeAllSessions();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <PageLoader />;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Active Sessions</CardTitle>
        {sessions && sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              revokeAllMutation.mutate(undefined, {
                onError: (err) => setError((err as Error)?.message ?? 'Failed to revoke sessions'),
              });
            }}
            disabled={revokeAllMutation.isPending}
          >
            Revoke all other sessions
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error && <Alert variant="error" className="mb-3">{error}</Alert>}
        {sessions && sessions.length > 0 ? (
          <div className="divide-y divide-border">
            {sessions.map((session, index) => {
              const device = parseDevice(session.userAgent);
              const browser = parseBrowser(session.userAgent);
              const DeviceIcon = device.icon;
              // Heuristic: the most recently created session is likely the current one
              const isCurrent = index === 0;

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className="flex items-center gap-3 py-3"
                >
                  <DeviceIcon className="h-5 w-5 text-text-tertiary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {browser} · {device.label}
                      </p>
                      {isCurrent && (
                        <Badge variant="success" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary">
                      IP: {session.ipAddress ?? 'Unknown'} · Created {formatRelativeTime(session.createdAt)}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Expires {formatRelativeTime(session.expiresAt)}
                    </p>
                  </div>
                  {!isCurrent && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setError(null);
                        revokeMutation.mutate(session.id, {
                          onError: (err) => setError((err as Error)?.message ?? 'Failed to revoke session'),
                        });
                      }}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-error" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">No active sessions found.</p>
        )}
      </CardContent>
    </Card>
  );
}
