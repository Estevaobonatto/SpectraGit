import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/ui/spinner';
import { motion } from 'motion/react';
import type { NotificationType } from '@/types';

const TYPE_LABELS: Record<NotificationType, { label: string; description: string }> = {
  ISSUE_CREATED: { label: 'New Issues', description: 'When an issue is created in your repositories' },
  ISSUE_CLOSED: { label: 'Issue Closed', description: 'When an issue you follow is closed' },
  ISSUE_COMMENT: { label: 'Issue Comments', description: 'When someone comments on an issue you follow' },
  PR_CREATED: { label: 'New Pull Requests', description: 'When a pull request is opened in your repositories' },
  PR_MERGED: { label: 'PR Merged', description: 'When a pull request you follow is merged' },
  PR_CLOSED: { label: 'PR Closed', description: 'When a pull request you follow is closed' },
  PR_COMMENT: { label: 'PR Comments', description: 'When someone comments on a pull request you follow' },
  PR_REVIEW: { label: 'PR Reviews', description: 'When someone reviews your pull request' },
  MENTION: { label: 'Mentions', description: 'When someone mentions you in a comment' },
  REPO_PUSHED: { label: 'Repository Push', description: 'When someone pushes to your repositories' },
  REPO_INVITE: { label: 'Repository Invites', description: 'When you are invited to a repository' },
  ORG_INVITE: { label: 'Organization Invites', description: 'When you are invited to an organization' },
};

export default function NotificationsSection() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  if (isLoading) return <PageLoader />;

  const handleToggle = (notificationType: string, currentEnabled: boolean) => {
    const updated = (preferences ?? []).map((p) =>
      p.notificationType === notificationType
        ? { ...p, enabled: !currentEnabled }
        : p,
    );
    updateMutation.mutate(
      updated.map((p) => ({ notificationType: p.notificationType, enabled: p.enabled })),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you want to receive.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {(preferences ?? []).map((pref, index) => {
            const meta = TYPE_LABELS[pref.notificationType as NotificationType] ?? {
              label: pref.notificationType,
              description: '',
            };

            return (
              <motion.div
                key={pref.notificationType}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center justify-between py-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-text-tertiary">{meta.description}</p>
                </div>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={() => handleToggle(pref.notificationType, pref.enabled)}
                  disabled={updateMutation.isPending}
                />
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
