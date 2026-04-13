import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWikiPageVersions, useRestoreWikiVersion } from '@/hooks/useWiki';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import type { WikiPageVersion } from '@/types';

export default function WikiHistoryPage() {
  const { owner, repo, slug } = useParams<{ owner: string; repo: string; slug: string }>();
  const navigate = useNavigate();

  const { data: versions, isLoading, error } = useWikiPageVersions(owner!, repo!, slug!);
  const restoreMutation = useRestoreWikiVersion(owner!, repo!, slug!);

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <Alert variant="error" title="Failed to load history">
        Could not load version history for this page.
      </Alert>
    );
  }

  const handleRestore = async (version: number) => {
    if (!confirm(`Restore page to version ${version}?`)) return;
    await restoreMutation.mutateAsync(version);
    navigate(`/${owner}/${repo}/wiki/${slug}`);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Link to={`/${owner}/${repo}/wiki`} className="hover:text-text-primary transition-colors">
          Wiki
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/${owner}/${repo}/wiki/${slug}`} className="hover:text-text-primary transition-colors">
          {slug}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-primary font-medium">History</span>
      </nav>

      <h1 className="text-xl font-bold text-text-primary">Version History</h1>

      {versions && versions.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-border divide-y divide-border">
          {versions.map((v: WikiPageVersion) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-text-primary">
                    v{v.version}
                  </span>
                  {v.message && (
                    <span className="text-sm text-text-secondary truncate">{v.message}</span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {v.editor?.username ?? 'Unknown'} · {new Date(v.createdAt).toLocaleString()}
                </p>
              </div>
              {v.version !== versions[0]?.version && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestore(v.version)}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restore
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-tertiary">No version history available.</p>
      )}
    </div>
  );
}
