import { useState, useMemo } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { File, Folder, ChevronDown, GitBranch, History, Copy, Download, BookOpen, KeyRound, Terminal, Check, Lock } from 'lucide-react';
import { useFileTree, useFileContent } from '@/hooks/useRepositories';
import { useBranches } from '@/hooks/useBranches';
import { useCommits } from '@/hooks/useBranches';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { InlineLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkdownRenderer } from '@/components/repo/MarkdownRenderer';
import { motion } from 'motion/react';
import type { Repository, FileTreeItem } from '@/types';

export default function CodeBrowserPage() {
  const { owner, repo, branch: branchParam, '*': pathParam } = useParams();
  const { repository } = useOutletContext<{ repository: Repository }>();
  const currentBranch = branchParam ?? repository.defaultBranch;
  const currentPath = pathParam ?? '';

  const { data: branches } = useBranches(owner!, repo!);
  const { data: tree, isLoading } = useFileTree(owner!, repo!, currentBranch, currentPath || undefined);
  const { data: commits } = useCommits(owner!, repo!, { branch: currentBranch, limit: 1 });
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [cloneTab, setCloneTab] = useState<'https' | 'ssh'>('https');

  const lastCommit = commits?.[0];
  const httpsCloneUrl = `${window.location.origin}/${owner}/${repo}.git`;
  const sshPort = window.location.hostname === 'localhost' ? 2222 : 22;
  const sshHost = window.location.hostname;
  const sshCloneUrl = sshPort === 22
    ? `git@${sshHost}:${owner}/${repo}.git`
    : `ssh://git@${sshHost}:${sshPort}/${owner}/${repo}.git`;
  const cloneUrl = cloneTab === 'ssh' ? sshCloneUrl : httpsCloneUrl;
  const cloneCmd = `git clone ${cloneUrl}`;

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneUrl);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(cloneCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const sortedTree = [...(tree ?? [])].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });

  // Detect renderable files at root (README, LICENSE, etc.)
  const RENDERABLE_FILES = [
    'readme.md', 'readme.mdx', 'readme.markdown', 'readme',
    'license.md', 'license', 'licence.md', 'licence',
    'contributing.md', 'changelog.md', 'code_of_conduct.md',
  ];
  const renderableFile = useMemo(() => {
    if (currentPath || !tree) return null;
    for (const name of RENDERABLE_FILES) {
      const found = tree.find(
        (f) => f.type === 'file' && f.name.toLowerCase() === name,
      );
      if (found) return found;
    }
    return null;
  }, [tree, currentPath]);

  const isMarkdownFile = renderableFile
    ? /\.(md|mdx|markdown)$/i.test(renderableFile.name)
    : false;

  const { data: renderableContent } = useFileContent(
    owner!, repo!, currentBranch, renderableFile?.path ?? '',
    { enabled: !!renderableFile },
  );

  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                {currentBranch}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {(branches ?? []).map((b) => (
                <DropdownMenuItem key={b.id} asChild>
                  <Link to={`/${owner}/${repo}/tree/${b.name}`}>
                    <GitBranch className="mr-2 h-3.5 w-3.5" />
                    {b.name}
                    {b.name === repository.defaultBranch && (
                      <Badge variant="outline" className="ml-2 text-[10px]">default</Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {pathSegments.length > 0 && (
            <div className="flex items-center gap-1 text-sm">
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
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/${owner}/${repo}/commits`}>
              <History className="h-3.5 w-3.5 mr-1" />
              Commits
            </Link>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="default" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Clone
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="p-4 space-y-4">
                {/* Protocol tabs */}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => { setCloneTab('https'); setCopiedClone(false); setCopiedCmd(false); }}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-xs font-medium transition-colors',
                      cloneTab === 'https'
                        ? 'bg-surface-hover text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    <Lock className="h-3 w-3 inline mr-1" />
                    HTTPS
                  </button>
                  <button
                    onClick={() => { setCloneTab('ssh'); setCopiedClone(false); setCopiedCmd(false); }}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
                      cloneTab === 'ssh'
                        ? 'bg-surface-hover text-text-primary'
                        : 'text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    <Terminal className="h-3 w-3 inline mr-1" />
                    SSH
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" />
                    Clone with {cloneTab === 'ssh' ? 'SSH' : 'HTTPS'}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background px-3 py-1.5 text-xs border border-border truncate font-mono">
                      {cloneUrl}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyClone}>
                      {copiedClone ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary">Terminal command</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background px-3 py-1.5 text-xs border border-border truncate font-mono">
                      git clone {cloneUrl}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyCmd}>
                      {copiedCmd ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <p className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3" />
                    Authentication
                  </p>
                  {cloneTab === 'ssh' ? (
                    <>
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        Use an <strong>SSH key</strong> for authentication. Add your public key to your account settings.
                      </p>
                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                        <Link to="/settings/ssh-keys">
                          <KeyRound className="h-3 w-3 mr-1.5" />
                          Manage SSH Keys
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-text-tertiary leading-relaxed">
                        Use a <strong>Personal Access Token</strong> as your password when Git prompts for credentials. Your username can be anything.
                      </p>
                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                        <Link to="/settings/tokens">
                          <KeyRound className="h-3 w-3 mr-1.5" />
                          Manage Access Tokens
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {lastCommit && (
        <div className="flex items-center gap-3 rounded-t-[var(--radius-md)] border border-border bg-surface-hover px-4 py-2.5 text-sm">
          <span className="font-medium truncate">{lastCommit.authorName}</span>
          <Link
            to={`/${owner}/${repo}/commits/${lastCommit.sha}`}
            className="flex-1 truncate text-text-secondary hover:text-primary-500"
          >
            {lastCommit.message}
          </Link>
          <span className="shrink-0 text-xs text-text-tertiary">
            {formatRelativeTime(lastCommit.date)}
          </span>
        </div>
      )}

      {isLoading ? (
        <InlineLoader text="Loading files..." />
      ) : sortedTree.length === 0 ? (
        <EmptyState
          icon={File}
          title="This repository is empty"
          description="Get started by creating a new file or pushing an existing repository."
        />
      ) : (
        <div className={cn('divide-y divide-border rounded-b-[var(--radius-md)] border border-border', !lastCommit && 'rounded-t-[var(--radius-md)]')}>
          {sortedTree.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <FileRow item={item} owner={owner!} repo={repo!} branch={currentBranch} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Render README / LICENSE below file tree */}
      {renderableFile && renderableContent && (
        <motion.div
          className="rounded-[var(--radius-md)] border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex items-center gap-2 border-b border-border bg-surface-hover px-4 py-2 text-sm">
            <BookOpen className="h-4 w-4 text-text-tertiary" />
            <Link
              to={`/${owner}/${repo}/blob/${currentBranch}/${renderableFile.path}`}
              className="font-medium hover:text-primary-500 transition-colors"
            >
              {renderableFile.name}
            </Link>
          </div>
          <div className="px-6 py-5">
            {isMarkdownFile ? (
              <MarkdownRenderer content={renderableContent.content} />
            ) : (
              <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                {renderableContent.content}
              </pre>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FileRow({ item, owner, repo, branch }: { item: FileTreeItem; owner: string; repo: string; branch: string }) {
  const isDir = item.type === 'directory';
  const linkTo = isDir
    ? `/${owner}/${repo}/tree/${branch}/${item.path}`
    : `/${owner}/${repo}/blob/${branch}/${item.path}`;

  return (
    <Link
      to={linkTo}
      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-hover"
    >
      {isDir ? (
        <Folder className="h-4 w-4 text-primary-400" />
      ) : (
        <File className="h-4 w-4 text-text-tertiary" />
      )}
      <span className={cn('truncate', isDir && 'font-medium text-primary-600')}>
        {item.name}
      </span>
    </Link>
  );
}
