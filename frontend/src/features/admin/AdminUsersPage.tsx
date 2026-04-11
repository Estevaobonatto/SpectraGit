import { useState } from 'react';
import { Shield, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminUsers, useUpdateAdminUser } from '@/hooks/useAdmin';
import { useAuthStore } from '@/stores/auth.store';
import type { AdminUser } from '@/services/admin.service';

function UserRow({ user, currentUserId }: { user: AdminUser; currentUserId: string }) {
  const updateUser = useUpdateAdminUser();
  const isSelf = user.id === currentUserId;

  const handleRoleToggle = () => {
    updateUser.mutate({
      userId: user.id,
      payload: {
        systemRole: user.systemRole === 'SYSTEM_ADMIN' ? 'USER' : 'SYSTEM_ADMIN',
      },
    });
  };

  const handleDisableToggle = () => {
    updateUser.mutate({
      userId: user.id,
      payload: { isDisabled: !user.isDisabled },
    });
  };

  const initials = (user.displayName ?? user.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar className="h-9 w-9">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-foreground truncate">{user.username}</p>
          {user.isDisabled && (
            <Badge variant="outline" className="text-xs text-red-500 border-red-200">
              Disabled
            </Badge>
          )}
          {isSelf && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge
          className={
            user.systemRole === 'SYSTEM_ADMIN'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              : 'bg-muted text-muted-foreground'
          }
        >
          {user.systemRole === 'SYSTEM_ADMIN' ? 'Admin' : 'User'}
        </Badge>
        <span className="text-xs text-muted-foreground w-16 text-right">
          {user._count.ownedRepos} repos
        </span>
      </div>

      {!isSelf && (
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={user.systemRole === 'SYSTEM_ADMIN' ? 'Remove admin' : 'Make admin'}
            onClick={handleRoleToggle}
            disabled={updateUser.isPending}
          >
            {user.systemRole === 'SYSTEM_ADMIN' ? (
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={user.isDisabled ? 'Enable account' : 'Disable account'}
            onClick={handleDisableToggle}
            disabled={updateUser.isPending}
          >
            {user.isDisabled ? (
              <UserCheck className="h-4 w-4 text-green-500" />
            ) : (
              <UserX className="h-4 w-4 text-red-400" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers(page, 25);
  const currentUserId = useAuthStore((s) => s.user?.id ?? '');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {data ? `${data.meta.total} registered users` : 'Loading…'}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            All users · Page {page} of {data?.meta.totalPages ?? '…'}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading && (
            <p className="py-8 text-center text-muted-foreground text-sm">Loading users…</p>
          )}
          {data?.users.map((u) => (
            <UserRow key={u.id} user={u} currentUserId={currentUserId} />
          ))}
        </CardContent>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
