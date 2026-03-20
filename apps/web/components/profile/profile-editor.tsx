/**
 * Profile Editor Component
 * 
 * Allows users to edit their profile information including bio, location, and website.
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';

interface ProfileEditorProps {
  initialData?: {
    name: string;
    email: string;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    image?: string | null;
  };
  onSave: (data: { bio?: string; location?: string; website?: string; image?: string }) => Promise<void>;
}

export function ProfileEditor({ initialData, onSave }: ProfileEditorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [image, setImage] = useState(initialData?.image || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave({ bio, location, website, image });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }, [bio, location, website, image, onSave]);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleWebsiteBlur = useCallback(() => {
    if (website && !validateUrl(website)) {
      setError('Please enter a valid website URL');
    } else {
      setError(null);
    }
  }, [website]);

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile information and bio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={image || undefined} />
              <AvatarFallback>
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onBlur={handleWebsiteBlur}
              placeholder="yourwebsite.com"
            />
          </div>

          {/* Status Messages */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600">Profile saved successfully!</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default ProfileEditor;
