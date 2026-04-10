import { Link } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { useMyOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';

export default function OrganizationListPage() {
  const { data: memberships, isLoading } = useMyOrganizations();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Organizations</h1>
        <Button size="sm" asChild>
          <Link to="/organizations/new">
            <Plus className="h-4 w-4" />
            New organization
          </Link>
        </Button>
      </div>

      {!memberships || memberships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create an organization to collaborate with your team."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((membership) => {
            const org = membership.organization;
            return (
              <Link
                key={membership.id}
                to={`/orgs/${org?.name ?? membership.id}`}
                className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border p-4 transition-colors hover:bg-surface-hover"
              >
                <Avatar src={org?.avatarUrl} alt={org?.name ?? ''} fallback={org?.displayName || org?.name || '?'} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary">{org?.displayName || org?.name}</p>
                  {org?.name && <p className="text-sm text-text-tertiary">@{org.name}</p>}
                  {org?.description && (
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">{org.description}</p>
                  )}
                  <Badge variant="secondary" className="mt-2 text-[10px]">{membership.role}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
