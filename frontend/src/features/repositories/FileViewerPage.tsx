import { useParams, Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, FileText, Copy } from 'lucide-react';
import { useFileContent } from '@/hooks/useRepositories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import type { Repository } from '@/types';
import { motion } from 'motion/react';

export default function FileViewerPage() {
  const { owner, repo, branch, '*': filePath } = useParams();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const currentBranch = branch ?? repository.defaultBranch;

  const { data: file, isLoading, error } = useFileContent(owner!, repo!, currentBranch, filePath!);

  if (isLoading) return <PageLoader />;

  if (error || !file) {
    return <Alert variant="error" title="File not found">Could not load the requested file.</Alert>;
  }

  const pathSegments = filePath?.split('/').filter(Boolean) ?? [];
  const lines = file.content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link to={`/${owner}/${repo}/tree/${currentBranch}/${pathSegments.slice(0, -1).join('/')}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-1 flex-wrap">
          <Link to={`/${owner}/${repo}/tree/${currentBranch}`} className="text-primary-500 hover:underline">
            {repo}
          </Link>
          {pathSegments.map((seg, i) => {
            const segPath = pathSegments.slice(0, i + 1).join('/');
            const isLast = i === pathSegments.length - 1;
            return (
              <span key={segPath} className="flex items-center gap-1">
                <span className="text-text-tertiary">/</span>
                {isLast ? (
                  <span className="font-medium">{seg}</span>
                ) : (
                  <Link to={`/${owner}/${repo}/tree/${currentBranch}/${segPath}`} className="text-primary-500 hover:underline">
                    {seg}
                  </Link>
                )}
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-surface-hover px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-text-tertiary" />
            <span className="font-medium">{file.name}</span>
            <Badge variant="outline" className="text-[10px]">{lines.length} lines</Badge>
            <Badge variant="outline" className="text-[10px]">{formatBytes(file.size)}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-surface-hover">
                  <td className="select-none border-r border-border px-3 py-0 text-right text-xs text-text-tertiary w-12">
                    {i + 1}
                  </td>
                  <td className="px-4 py-0 whitespace-pre">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
