import { useQuery } from '@tanstack/react-query';
import { Webhook, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { integrationsService } from '@/services/integrations.service';

interface WebhookEventsListProps {
  enabled?: boolean;
}

export default function WebhookEventsList({ enabled = true }: WebhookEventsListProps) {
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['github-webhook-events'],
    queryFn: () => integrationsService.listWebhookEvents(),
    enabled,
    refetchInterval: enabled ? 10000 : false,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <Webhook className="h-8 w-8 text-text-tertiary/40" />
          <p className="text-sm text-text-tertiary">No webhook events received yet.</p>
          <p className="text-xs text-text-tertiary/60">
            Events will appear here when GitHub sends webhooks to your repositories.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Webhook className="h-4 w-4" />
          Recent Webhook Events
          <Badge variant="secondary" className="text-[10px]">{events.length}</Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border p-3"
            >
              <div className="mt-0.5 shrink-0">
                {event.processed ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : event.error ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <Clock className="h-4 w-4 text-warning" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {event.eventType}
                  </Badge>
                  <span className="text-[10px] text-text-tertiary font-mono truncate">
                    {event.deliveryId.slice(0, 16)}...
                  </span>
                </div>
                {event.error && (
                  <p className="mt-1 text-xs text-destructive line-clamp-2">{event.error}</p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[10px] text-text-tertiary">
                  <Clock className="h-3 w-3" />
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
