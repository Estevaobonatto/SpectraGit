import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Topbar } from './Topbar';
import { PublicTopbar } from './PublicTopbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/stores/auth.store';

const STATIC_PATHS = ['repositories', 'organizations', 'orgs', 'notifications', 'settings', 'integrations', 'explore', 'docs'];

function getRouteKey(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && !STATIC_PATHS.includes(parts[0])) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return pathname;
}

export function PublicShell() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        {isAuthenticated ? <Topbar /> : <PublicTopbar />}
        <main className="pt-14 min-h-screen">
          <div className="mx-auto max-w-[1480px] px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={getRouteKey(location.pathname)}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
