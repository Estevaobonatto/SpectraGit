import { useState } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, AlertTriangle, Check } from 'lucide-react';
import { useTokens, useCreateToken, useRevokeToken } from '@/hooks/useTokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InlineLoader } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelativeTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TokensSection() {
  const { data: tokens, isLoading } = useTokens();
  const createToken = useCreateToken();
  const revokeToken = useRevokeToken();

  const [showCreate, setShowCreate] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [expiresIn, setExpiresIn] = useState('90');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newTokenName.trim()) return;
    const expiresAt = expiresIn !== 'never'
      ? new Date(Date.now() + parseInt(expiresIn) * 86400000).toISOString()
      : undefined;

    const result = await createToken.mutateAsync({
      name: newTokenName.trim(),
      scopes: ['repo'],
      expiresAt,
    });

    setCreatedToken(result.token);
    setNewTokenName('');
    setShowCreate(false);
  };

  const handleCopyToken = () => {
    if (!createdToken) return;
    navigator.clipboard.writeText(createdToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  const handleRevoke = async (id: string) => {
    await revokeToken.mutateAsync(id);
    setConfirmRevoke(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Key className="h-5 w-5" />
            Personal Access Tokens
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Tokens are used to authenticate Git operations over HTTPS.
            Use them as your password when cloning, pushing, or pulling.
          </p>
        </div>
        {!showCreate && !createdToken && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Token
          </Button>
        )}
      </div>

      {/* Created token banner — shown only once */}
      <AnimatePresence>
        {createdToken && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-3"
          >
            <div className="flex items-start gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Copy your token now — it won't be shown again!</p>
                <p className="text-xs mt-1 text-yellow-600/80">
                  This token provides access to your repositories. Keep it secure.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-background px-3 py-2 text-xs font-mono border border-border break-all">
                {showToken ? createdToken : '•'.repeat(60)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCopyToken}
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-tertiary flex-1">
                Use this token as password when Git asks for credentials:<br />
                <code className="text-[11px]">git clone https://your-username:{'{'}token{'}'} @host/owner/repo.git</code>
              </p>
              <Button size="sm" variant="outline" onClick={() => setCreatedToken(null)}>
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-border bg-surface-secondary p-4 space-y-4"
          >
            <h3 className="font-medium text-sm">Create new token</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Token name</label>
                <Input
                  placeholder="e.g., CLI access, IDE token"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">Expiration</label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                  <option value="never">No expiration</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newTokenName.trim() || createToken.isPending}
                >
                  {createToken.isPending ? 'Creating...' : 'Create token'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token list */}
      {isLoading ? (
        <InlineLoader text="Loading tokens..." />
      ) : !tokens?.length ? (
        <EmptyState
          icon={Key}
          title="No tokens yet"
          description="Create a personal access token to authenticate Git operations over HTTPS."
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-text-tertiary" />
                  <span className="font-medium text-sm">{token.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {token.tokenPrefix}...
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>Created {formatRelativeTime(token.createdAt)}</span>
                  {token.lastUsedAt && (
                    <span>Last used {formatRelativeTime(token.lastUsedAt)}</span>
                  )}
                  {token.expiresAt && (
                    <span>
                      {new Date(token.expiresAt) < new Date()
                        ? 'Expired'
                        : `Expires ${formatRelativeTime(token.expiresAt)}`}
                    </span>
                  )}
                </div>
              </div>
              <div>
                {confirmRevoke === token.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevoke(token.id)}
                      disabled={revokeToken.isPending}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setConfirmRevoke(token.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage instructions */}
      <div className="rounded-lg border border-border bg-surface-secondary p-4 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          Using tokens with Git
        </h3>
        <div className="space-y-2 text-xs text-text-secondary font-mono">
          <div>
            <p className="text-text-tertiary mb-1 font-sans">Clone a repository:</p>
            <code className="block bg-background rounded px-3 py-2 border border-border">
              git clone {window.location.origin}/owner/repo.git
            </code>
          </div>
          <div>
            <p className="text-text-tertiary mb-1 font-sans">When prompted for credentials, use:</p>
            <code className="block bg-background rounded px-3 py-2 border border-border">
              Username: your-username<br />
              Password: sgit_your_token_here
            </code>
          </div>
          <div>
            <p className="text-text-tertiary mb-1 font-sans">Or embed the token in the URL:</p>
            <code className="block bg-background rounded px-3 py-2 border border-border">
              git clone https://x-token:sgit_your_token@{window.location.host}/owner/repo.git
            </code>
          </div>
          <div>
            <p className="text-text-tertiary mb-1 font-sans">Store credentials to avoid re-entering:</p>
            <code className="block bg-background rounded px-3 py-2 border border-border">
              git config --global credential.helper store
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
