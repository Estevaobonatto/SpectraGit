import { useState, useEffect } from 'react';
import { useCurrentUser, useUpdateProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Alert } from '@/components/ui/alert';
import { PageLoader } from '@/components/ui/spinner';

export default function ProfileSection() {
  const { data: user, isLoading } = useCurrentUser();
  const updateMutation = useUpdateProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '');
      setBio(user.bio ?? '');
      setLocation(user.location ?? '');
      setWebsite(user.website ?? '');
      setDirty(false);
    }
  }, [user]);

  if (isLoading || !user) return <PageLoader />;

  const handleSave = () => {
    setError(null);
    setSuccess(false);
    updateMutation.mutate(
      { displayName, bio, location, website },
      {
        onSuccess: () => { setDirty(false); setSuccess(true); },
        onError: (err) => setError((err as Error)?.message ?? 'Failed to save profile'),
      },
    );
  };

  return (
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
            onChange={(e) => { setDisplayName(e.target.value); setDirty(true); }}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => { setBio(e.target.value); setDirty(true); }}
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
              onChange={(e) => { setLocation(e.target.value); setDirty(true); }}
              placeholder="City, Country"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => { setWebsite(e.target.value); setDirty(true); }}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending || !dirty}>
          Save profile
        </Button>
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">Profile saved successfully.</Alert>}
      </CardContent>
    </Card>
  );
}
