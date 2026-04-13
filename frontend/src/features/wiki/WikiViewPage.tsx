import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { Pencil, Trash2, History, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { useWikiPage, useDeleteWikiPage } from '@/hooks/useWiki';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import type { Repository } from '@/types';

export default function WikiViewPage() {
  const { owner, repo, slug } = useParams<{ owner: string; repo: string; slug: string }>();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const navigate = useNavigate();

  const { data: page, isLoading, error } = useWikiPage(owner!, repo!, slug!);
  const deleteMutation = useDeleteWikiPage(owner!, repo!);

  if (isLoading) return <PageLoader />;

  if (error || !page) {
    return (
      <Alert variant="error" title="Page not found">
        The wiki page "{slug}" does not exist.
      </Alert>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${page.title}"?`)) return;
    await deleteMutation.mutateAsync(slug!);
    navigate(`/${owner}/${repo}/wiki`);
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-tertiary">
        <Link to={`/${owner}/${repo}/wiki`} className="hover:text-text-primary transition-colors">
          Wiki
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-primary font-medium">{page.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary">{page.title}</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${owner}/${repo}/wiki/${slug}/history`)}
          >
            <History className="h-4 w-4 mr-1.5" />
            History
          </Button>
          {repository.canEdit && (
            <>
              <Button
                size="sm"
                onClick={() => navigate(`/${owner}/${repo}/wiki/${slug}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-text-tertiary border-b border-border pb-4">
        {page.createdBy && (
          <span>
            Created by <span className="text-text-secondary font-medium">{page.createdBy.username}</span>
          </span>
        )}
        {page.updatedBy && (
          <span>
            Last edited by <span className="text-text-secondary font-medium">{page.updatedBy.username}</span>
          </span>
        )}
        <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Body */}
      <div className="prose-wiki">
        <MarkdownRenderer content={page.body} />
      </div>

      {/* Children */}
      {page.children && page.children.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">Sub-pages</h3>
          <div className="rounded-[var(--radius-md)] border border-border divide-y divide-border">
            {page.children.map((child) => (
              <Link
                key={child.id}
                to={`/${owner}/${repo}/wiki/${child.slug}`}
                className="block px-4 py-2.5 text-sm text-text-primary hover:bg-surface-hover/50 transition-colors"
              >
                {child.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
