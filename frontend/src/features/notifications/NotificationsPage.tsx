import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { cn, formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  if (isLoading) return <PageLoader />;

  const items = notifications?.data ?? [];
  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Bell className="h-6 w-6" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-1">{unreadCount}</Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up!"
        />
      ) : (
        <div className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
          {items.map((n, index) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                !n.isRead && 'bg-primary-50/50',
              )}
            >
              <div className={cn('mt-1 h-2 w-2 rounded-full shrink-0', !n.isRead ? 'bg-primary-500' : 'bg-transparent')} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                  <Badge variant="secondary" className="text-[10px]">{n.type.replace('_', ' ')}</Badge>
                  <span>{formatRelativeTime(n.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => markReadMutation.mutate(n.id)}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(n.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-error" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
