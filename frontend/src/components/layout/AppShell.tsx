import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppShell() {
  const { sidebarOpen } = useUIStore();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Topbar />
        <main
          className={cn(
            'pt-14 min-h-screen transition-all duration-200',
            sidebarOpen ? 'pl-60' : 'pl-16',
          )}
        >
          <div className="mx-auto max-w-6xl px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
