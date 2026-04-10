import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User, Settings, Plus, Home, BookOpen, Building2, ExternalLink, Compass } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useNotificationCount } from '@/hooks/useNotifications';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/repositories', label: 'Repositories', icon: BookOpen },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/integrations/github', label: 'GitHub Sync', icon: ExternalLink },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: unreadCount } = useNotificationCount();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    if (refreshToken) {
      authService.logout(refreshToken).catch(() => {/* ignore — local state is cleared regardless */});
    }
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-surface/80 backdrop-blur-sm px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center shrink-0">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary-500 text-white text-sm font-bold"
        >
          S
        </motion.div>
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

      {/* Search — grows to fill remaining space */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-sm ml-auto">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          ref={searchRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search... (Ctrl+K)"
          className="pl-9 h-8 text-sm bg-background"
        />
      </form>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Create new</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate('/repositories/new')}>
              New repository
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/organizations/new')}>
              New organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] bg-error text-white border-0">
              {unreadCount! > 99 ? '99+' : unreadCount}
            </Badge>
            </motion.div>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              <Avatar src={user?.avatarUrl} alt={user?.displayName ?? user?.username ?? ''} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.displayName ?? user?.username}</span>
                <span className="text-xs text-text-secondary">@{user?.username}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(`/${user?.username}`)}>
              <User className="mr-2 h-4 w-4" />
              Your profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/repositories')}>
              Your repositories
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-error">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
