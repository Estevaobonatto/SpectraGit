import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemHealth } from '@/hooks/useAdmin';

function StatusBadge({ status }: { status: string }) {
  if (status === 'ok') {
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Healthy</Badge>;
  }
  if (status === 'warning') {
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Warning</Badge>;
  }
  return <Badge variant="destructive">Error</Badge>;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${seconds % 60}s`;
}

export default function AdminHealthPage() {
  const { data, isLoading, refetch, isFetching } = useSystemHealth();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time status of all components
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading health data…</div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={data.status} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground">{formatUptime(data.uptime)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground">{data.memoryUsageMb} MB</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                  Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground font-mono text-sm">{data.version}</p>
              </CardContent>
            </Card>
          </div>

          {/* Components */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Components</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {/* Database */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-foreground">Database (PostgreSQL)</p>
                  {'latencyMs' in data.components.database && (
                    <p className="text-xs text-muted-foreground">
                      Latency: {data.components.database.latencyMs}ms
                    </p>
                  )}
                  {'message' in data.components.database && (
                    <p className="text-xs text-destructive">{data.components.database.message as string}</p>
                  )}
                </div>
                <StatusBadge status={data.components.database.status} />
              </div>

              {/* Git Storage */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-foreground">Git Storage</p>
                  {'path' in data.components.gitStorage && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {data.components.gitStorage.path}
                    </p>
                  )}
                  {'message' in data.components.gitStorage && (
                    <p className="text-xs text-destructive">{data.components.gitStorage.message as string}</p>
                  )}
                </div>
                <StatusBadge status={data.components.gitStorage.status} />
              </div>

              {/* Runtime */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm text-foreground">Node.js Runtime</p>
                  <p className="text-xs text-muted-foreground">
                    {data.nodeVersion} · {data.platform}
                  </p>
                </div>
                <StatusBadge status="ok" />
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center text-destructive py-12">Failed to load health data</div>
      )}
    </div>
  );
}
