import { useParams, Link } from 'react-router-dom';
import { MapPin, Link as LinkIcon, Calendar, BookMarked } from 'lucide-react';
import { useUserByUsername } from '@/hooks/useAuth';
import { useRepositories } from '@/hooks/useRepositories';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';

export default function ProfilePage() {
  const { owner } = useParams();
  const { data: user, isLoading } = useUserByUsername(owner!);
  const { data: repos } = useRepositories();

  if (isLoading || !user) return <PageLoader />;

  const repoList = repos?.data ?? [];

  return (
    <motion.div
      className="flex gap-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Profile sidebar */}
      <aside className="w-72 shrink-0 space-y-4">
        <Avatar src={user.avatarUrl} alt={user.username} size="lg" className="h-64 w-64 rounded-full" />
        <div>
          {user.displayName && <h1 className="text-2xl font-bold text-text-primary">{user.displayName}</h1>}
          <p className="text-lg text-text-tertiary">@{user.username}</p>
        </div>
        {user.bio && <p className="text-sm text-text-secondary">{user.bio}</p>}
        <div className="space-y-1 text-sm text-text-secondary">
          {user.location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-text-tertiary" />
              {user.location}
            </p>
          )}
          {user.website && (
            <p className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-text-tertiary" />
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            </p>
          )}
          {user.createdAt && (
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-text-tertiary" />
              Joined {formatDate(user.createdAt)}
            </p>
          )}
        </div>
      </aside>

      <Separator orientation="vertical" />

      {/* Repositories */}
      <main className="flex-1 space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Repositories</h2>
        {repoList.length === 0 ? (
          <EmptyState icon={BookMarked} title="No repositories yet" description="This user hasn't created any repositories." />
        ) : (
          <div className="space-y-3">
            {repoList.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
              <Link
                
                to={`/${owner}/${r.name}`}
                className="block rounded-[var(--radius-md)] border border-border p-4 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary-600">{r.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{r.visibility}</Badge>
                </div>
                {r.description && <p className="mt-1 text-sm text-text-secondary line-clamp-2">{r.description}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                  {r.language && <span>{r.language}</span>}
                  <span>Updated {formatRelativeTime(r.updatedAt)}</span>
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}
