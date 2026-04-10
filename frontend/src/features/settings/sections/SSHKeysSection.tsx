import { useState } from 'react';
import { Key, Plus, Trash2 } from 'lucide-react';
import { useSSHKeys, useAddSSHKey, useDeleteSSHKey } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { formatRelativeTime } from '@/lib/utils';
import { motion } from 'motion/react';

export default function SSHKeysSection() {
  const { data: sshKeys } = useSSHKeys();
  const addKeyMutation = useAddSSHKey();
  const deleteKeyMutation = useDeleteSSHKey();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyTitle, setKeyTitle] = useState('');
  const [keyContent, setKeyContent] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddKey = () => {
    if (!keyTitle.trim() || !keyContent.trim()) return;
    setAddError(null);
    addKeyMutation.mutate(
      { title: keyTitle, publicKey: keyContent },
      {
        onSuccess: () => { setDialogOpen(false); setKeyTitle(''); setKeyContent(''); },
        onError: (err) => setAddError((err as Error)?.message ?? 'Failed to add SSH key'),
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          SSH Keys
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add SSH key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add SSH key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="keyTitle">Title</Label>
                <Input id="keyTitle" value={keyTitle} onChange={(e) => { setKeyTitle(e.target.value); setAddError(null); }} placeholder="e.g. Work laptop" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyContent">Key</Label>
                <Textarea
                  id="keyContent"
                  value={keyContent}
                  onChange={(e) => { setKeyContent(e.target.value); setAddError(null); }}
                  placeholder="ssh-ed25519 AAAA..."
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
              {addError && <Alert variant="error">{addError}</Alert>}
              <Button onClick={handleAddKey} disabled={addKeyMutation.isPending || !keyTitle.trim() || !keyContent.trim()}>
                Add key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {deleteError && <Alert variant="error" className="mb-3">{deleteError}</Alert>}
        {sshKeys && sshKeys.length > 0 ? (
          <div className="divide-y divide-border">
            {sshKeys.map((key, index) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex items-center gap-3 py-3"
              >
                <Key className="h-4 w-4 text-text-tertiary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{key.title}</p>
                  <p className="text-xs text-text-tertiary font-mono truncate">{key.fingerprint}</p>
                  <p className="text-xs text-text-tertiary">Added {formatRelativeTime(key.createdAt)}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setDeleteError(null);
                    deleteKeyMutation.mutate(key.id, {
                      onError: (err) => setDeleteError((err as Error)?.message ?? 'Failed to delete SSH key'),
                    });
                  }}
                  disabled={deleteKeyMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-error" />
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">No SSH keys added.</p>
        )}
      </CardContent>
    </Card>
  );
}
