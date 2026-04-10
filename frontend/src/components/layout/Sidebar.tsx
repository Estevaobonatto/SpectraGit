import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Building2,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/repositories', label: 'Repositories', icon: BookOpen },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

const bottomItems = [
  { to: '/integrations/github', label: 'GitHub Sync', icon: ExternalLink },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderItem = (item: (typeof navItems)[0], index: number) => {
    const active = isActive(item.to);
    const link = (
      <Link
        to={item.to}
        className={cn(
          'relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'text-primary-700'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          !sidebarOpen && 'justify-center px-2',
        )}
      >
        {active && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-[var(--radius-sm)] bg-primary-50"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon className="relative z-10 h-5 w-5 shrink-0" />
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative z-10 overflow-hidden whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );

    if (!sidebarOpen) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.to}>{link}</div>;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface transition-all duration-200',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      <div className={cn('flex h-14 items-center border-b border-border px-4', !sidebarOpen && 'justify-center px-2')}>
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-600">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary-500 text-white text-sm font-bold"
          >
            S
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                SpectraGit
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map(renderItem)}
      </nav>

      <div className="space-y-1 px-3 pb-2">
        <Separator className="mb-2" />
        {bottomItems.map(renderItem)}
      </div>

      <div className={cn('flex items-center border-t border-border p-2', sidebarOpen ? 'justify-end' : 'justify-center')}>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
