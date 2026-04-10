import { Link, useLocation } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
];

export function PublicTopbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-surface/80 backdrop-blur-sm px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center shrink-0 gap-2">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary-500 text-white text-sm font-bold"
        >
          S
        </motion.div>
        <span className="text-sm font-semibold text-text-primary hidden sm:inline">SpectraGit</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Auth buttons */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/login">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/login">Sign up</Link>
        </Button>
      </div>
    </header>
  );
}
