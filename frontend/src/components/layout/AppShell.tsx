import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Topbar } from './Topbar';
import { TooltipProvider } from '@/components/ui/tooltip';

// Only trigger page transition animation on top-level route changes,
// not on repo sub-tab navigation (/:owner/:repo becomes the stable key)
const STATIC_PATHS = ['repositories', 'organizations', 'orgs', 'notifications', 'settings', 'integrations'];

function getRouteKey(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && !STATIC_PATHS.includes(parts[0])) {
    return `/${parts[0]}/${parts[1]}`;
  }
  return pathname;
}

export function AppShell() {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <Topbar />
        <main className="pt-14 min-h-screen">
          <div className="mx-auto max-w-6xl px-6 py-6">
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
