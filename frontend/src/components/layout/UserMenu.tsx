"use client";

import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/utils';

function initials(name?: string | null, fallback = '?') {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
}

export function UserMenu() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Signed out');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to sign out'));
    } finally {
      router.push('/login');
    }
  };

  const label = user?.full_name || user?.username || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {initials(user?.full_name ?? user?.username)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start md:flex">
          <span className="text-sm font-medium leading-tight text-foreground">{label}</span>
          <span className="text-xs leading-tight text-muted-foreground">{user?.role ?? '—'}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuLabel className="truncate">{user?.email ?? label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <UserIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        {user?.role === 'admin' && (
          <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
