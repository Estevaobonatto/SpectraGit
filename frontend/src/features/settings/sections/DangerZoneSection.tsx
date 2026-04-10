import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser, useDeleteAccount } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';

export default function DangerZoneSection() {
  const { data: user } = useCurrentUser();
  const deleteMutation = useDeleteAccount();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canDelete = user && confirmation === user.username;

  const handleDelete = () => {
    if (!canDelete) return;
    setError(null);
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        navigate('/login');
      },
      onError: (err) => setError((err as Error)?.message ?? 'Failed to delete account'),
    });
  };

  return (
    <Card className="border-error/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-error">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-error/20 bg-error/5 p-4">
          <h3 className="text-sm font-semibold text-text-primary">Delete your account</h3>
          <p className="mt-1 text-xs text-text-tertiary">
            Once you delete your account, all of your repositories, issues, pull requests, and data will be permanently removed. This action cannot be undone.
          </p>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); setConfirmation(''); setError(null); }}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="mt-3">
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-error">Delete your account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Alert variant="error">
                  This action is <strong>permanent</strong> and cannot be undone. All your data will be deleted.
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="confirmDelete">
                    Type <strong>{user?.username}</strong> to confirm
                  </Label>
                  <Input
                    id="confirmDelete"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={user?.username ?? ''}
                  />
                </div>
                {error && <Alert variant="error">{error}</Alert>}
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canDelete || deleteMutation.isPending}
                  className="w-full"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'I understand, delete my account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
