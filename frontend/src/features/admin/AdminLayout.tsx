import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/health', label: 'Health', icon: Activity },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r bg-card hidden md:flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            A
          </div>
          <span className="font-semibold text-sm text-foreground">Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-2">
          <p className="text-xs text-muted-foreground px-3 truncate">{user?.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to app
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
