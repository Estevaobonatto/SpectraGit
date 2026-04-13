import { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { useCreateWikiPage, useWikiPage, useUpdateWikiPage } from '@/hooks/useWiki';
import { PageLoader } from '@/components/ui/spinner';
import type { Repository } from '@/types';

export default function WikiEditPage() {
  const { owner, repo, slug } = useParams<{ owner: string; repo: string; slug: string }>();
  useOutletContext<{ repository: Repository }>();
  const navigate = useNavigate();
  const isNew = !slug;

  const { data: existingPage, isLoading } = useWikiPage(owner!, repo!, slug ?? '', );

  const createMutation = useCreateWikiPage(owner!, repo!);
  const updateMutation = useUpdateWikiPage(owner!, repo!, slug ?? '');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Populate form when editing existing page
  if (!isNew && existingPage && !initialized) {
    setTitle(existingPage.title);
    setBody(existingPage.body);
    setInitialized(true);
  }

  if (!isNew && isLoading) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    if (isNew) {
      const page = await createMutation.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        message: message.trim() || undefined,
      });
      navigate(`/${owner}/${repo}/wiki/${page.slug}`);
    } else {
      await updateMutation.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        message: message.trim() || undefined,
      });
      navigate(`/${owner}/${repo}/wiki/${slug}`);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold text-text-primary mb-6">
        {isNew ? 'Create New Page' : `Edit: ${existingPage?.title ?? slug}`}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            required
            maxLength={255}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Content</Label>
          <MarkdownEditor
            value={body}
            onChange={setBody}
            placeholder="Write your wiki page content with Markdown…"
            rows={16}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message">Edit message (optional)</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your changes"
            maxLength={500}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isPending || !title.trim() || !body.trim()}>
            {isPending ? 'Saving…' : isNew ? 'Create Page' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isNew ? `/${owner}/${repo}/wiki` : `/${owner}/${repo}/wiki/${slug}`)}
          >
            Cancel
          </Button>
        </div>

        {(createMutation.error || updateMutation.error) && (
          <p className="text-sm text-red-500">
            {((createMutation.error || updateMutation.error) as Error)?.message ?? 'An error occurred'}
          </p>
        )}
      </form>
    </div>
  );
}
