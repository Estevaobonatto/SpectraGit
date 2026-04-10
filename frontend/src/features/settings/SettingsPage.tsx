import { useState } from 'react';
import { Settings, Key, Plus, Trash2 } from 'lucide-react';
import { useCurrentUser, useUpdateProfile, useSSHKeys, useAddSSHKey, useDeleteSSHKey } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';

export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateMutation = useUpdateProfile();
  const { data: sshKeys } = useSSHKeys();
  const addKeyMutation = useAddSSHKey();
  const deleteKeyMutation = useDeleteSSHKey();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [profileDirty, setProfileDirty] = useState(false);

  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyTitle, setKeyTitle] = useState('');
  const [keyContent, setKeyContent] = useState('');

  // Initialize form values from user data
  useState(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setBio(user.bio ?? '');
      setLocation(user.location ?? '');
      setWebsite(user.website ?? '');
    }
  });

  if (isLoading || !user) return <PageLoader />;

  const handleProfileSave = () => {
    updateMutation.mutate(
      { displayName, bio, location, website },
      { onSuccess: () => setProfileDirty(false) },
    );
  };

  const handleAddKey = () => {
    if (!keyTitle.trim() || !keyContent.trim()) return;
    addKeyMutation.mutate(
      { title: keyTitle, publicKey: keyContent },
      { onSuccess: () => { setKeyDialogOpen(false); setKeyTitle(''); setKeyContent(''); } },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
        <Settings className="h-6 w-6" />
        Settings
      </h1>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl} alt={user.username} size="lg" />
            <div>
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-text-tertiary">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setProfileDirty(true); }}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => { setBio(e.target.value); setProfileDirty(true); }}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setProfileDirty(true); }}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => { setWebsite(e.target.value); setProfileDirty(true); }}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <Button onClick={handleProfileSave} disabled={updateMutation.isPending || !profileDirty}>
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* SSH Keys */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            SSH Keys
          </CardTitle>
          <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
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
                  <Input id="keyTitle" value={keyTitle} onChange={(e) => setKeyTitle(e.target.value)} placeholder="e.g. Work laptop" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyContent">Key</Label>
                  <Textarea
                    id="keyContent"
                    value={keyContent}
                    onChange={(e) => setKeyContent(e.target.value)}
                    placeholder="ssh-ed25519 AAAA..."
                    rows={4}
                    className="font-mono text-xs"
                  />
                </div>
                <Button onClick={handleAddKey} disabled={addKeyMutation.isPending || !keyTitle.trim() || !keyContent.trim()}>
                  Add key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {sshKeys && sshKeys.length > 0 ? (
            <div className="divide-y divide-border">
              {sshKeys.map((key) => (
                <div key={key.id} className="flex items-center gap-3 py-3">
                  <Key className="h-4 w-4 text-text-tertiary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{key.title}</p>
                    <p className="text-xs text-text-tertiary font-mono truncate">{key.fingerprint}</p>
                    <p className="text-xs text-text-tertiary">Added {formatRelativeTime(key.createdAt)}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteKeyMutation.mutate(key.id)}
                    disabled={deleteKeyMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">No SSH keys added.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
