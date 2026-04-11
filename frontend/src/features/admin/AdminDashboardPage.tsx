import { Activity, Database, GitBranch, Settings, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSystemHealth, useAdminUsers } from '@/hooks/useAdmin';

function HealthDot({ status }: { status: string }) {
  const color =
    status === 'ok'
      ? 'bg-green-500'
      : status === 'warning'
        ? 'bg-yellow-400'
        : 'bg-red-500';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: health } = useSystemHealth();
  const { data: users } = useAdminUsers(1, 1);

  const quickLinks = [
    {
      icon: Users,
      label: 'Manage Users',
      description: 'View, promote, or disable user accounts',
      to: '/admin/users',
    },
    {
      icon: Settings,
      label: 'Instance Settings',
      description: 'Configure branding, SMTP, and other options',
      to: '/admin/settings',
    },
    {
      icon: Activity,
      label: 'System Health',
      description: 'Check database, storage, and runtime status',
      to: '/admin/health',
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your self-hosted SpectraGit instance
        </p>
      </div>

      {/* Status bar */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Database</span>
              <HealthDot status={health?.components.database.status ?? 'unknown'} />
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Git Storage</span>
              <HealthDot status={health?.components.gitStorage.status ?? 'unknown'} />
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Uptime</span>
              <span className="text-foreground font-medium">
                {health ? `${Math.floor(health.uptime / 3600)}h` : '…'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Total users</span>
              <span className="text-foreground font-medium">{users?.meta.total ?? '…'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map(({ icon: Icon, label, description, to }) => (
          <Card
            key={to}
            className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
            onClick={() => navigate(to)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Button variant="link" size="sm" className="mt-2 px-0 text-primary">
                Open →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
