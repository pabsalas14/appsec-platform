"use client";

import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  PageHeader,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useChangePassword, useUpdateProfile } from '@/hooks/useProfile';

function initials(name: string | null | undefined, fallback: string) {
  const base = (name?.trim() || fallback || '').trim();
  if (!base) return '??';
  return base
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '');
      setEmail(user.email);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const onSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName, email });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password — check your current password');
    }
  };

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader title="My Profile" description="Manage your personal details and account security." />

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials(user.full_name, user.username)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg font-semibold text-foreground">
              {user.full_name || user.username}
            </div>
            <div className="text-sm text-muted-foreground">@{user.username}</div>
            <div className="mt-1 flex gap-2">
              <Badge variant="default" className="bg-primary/10 text-primary">
                {user.role}
              </Badge>
              {user.is_active ? (
                <Badge variant="default" className="bg-emerald-500/10 text-emerald-400">
                  active
                </Badge>
              ) : (
                <Badge variant="default" className="bg-destructive/10 text-destructive">
                  inactive
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input value={user.username} disabled />
                <p className="mt-1 text-xs text-muted-foreground">
                  Usernames are immutable. Contact an administrator if you need to change it.
                </p>
              </div>
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={onSaveProfile} disabled={updateProfile.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={onChangePassword}
                  disabled={changePassword.isPending || !currentPassword || !newPassword}
                >
                  Change password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
