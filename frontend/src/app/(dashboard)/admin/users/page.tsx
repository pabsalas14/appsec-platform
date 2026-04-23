"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, Pencil, Plus, Trash2, UserX } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  PageWrapper,
  SearchInput,
  Select,
  Switch,
} from '@/components/ui';
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useResetUserPassword,
  useUpdateAdminUser,
} from '@/hooks/useAdminUsers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { extractErrorMessage, formatDate } from '@/lib/utils';
import type { User } from '@/types';

const createSchema = z.object({
  username: z.string().min(3).max(150),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().max(255),
  role: z.enum(['admin', 'user']),
  is_active: z.boolean(),
});
type CreateFormData = z.infer<typeof createSchema>;

const updateSchema = z.object({
  email: z.string().email(),
  full_name: z.string().max(255),
  role: z.enum(['admin', 'user']),
  is_active: z.boolean(),
});
type UpdateFormData = z.infer<typeof updateSchema>;

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const createMut = useCreateAdminUser();
  const form = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'user',
      is_active: true,
    },
  });

  const onSubmit = (data: CreateFormData) => {
    createMut.mutate(data, {
      onSuccess: () => {
        toast.success('User created');
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => toast.error(extractErrorMessage(err, 'Failed to create user')),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input placeholder="Username" {...form.register('username')} />
          <Input placeholder="Email" type="email" {...form.register('email')} />
          <Input placeholder="Initial password (min 8 chars)" type="password" {...form.register('password')} />
          <Input placeholder="Full name (optional)" {...form.register('full_name')} />
          <Select
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ]}
            {...form.register('role')}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('is_active')} className="h-4 w-4 rounded border-input" />
            Active account
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const updateMut = useUpdateAdminUser();
  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: user
      ? {
          email: user.email,
          full_name: user.full_name ?? '',
          role: (user.role as 'admin' | 'user') ?? 'user',
          is_active: user.is_active,
        }
      : { email: '', full_name: '', role: 'user', is_active: true },
    values: user
      ? {
          email: user.email,
          full_name: user.full_name ?? '',
          role: (user.role as 'admin' | 'user') ?? 'user',
          is_active: user.is_active,
        }
      : undefined,
  });

  if (!user) return null;

  const onSubmit = (data: UpdateFormData) => {
    updateMut.mutate(
      { id: user.id, data },
      {
        onSuccess: () => {
          toast.success('User updated');
          onClose();
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to update user')),
      },
    );
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Input placeholder="Email" type="email" {...form.register('email')} />
          <Input placeholder="Full name" {...form.register('full_name')} />
          <Select
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' },
            ]}
            {...form.register('role')}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('is_active')} className="h-4 w-4 rounded border-input" />
            Active account
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const resetMut = useResetUserPassword();
  const [password, setPassword] = useState('');

  if (!user) return null;

  const submit = () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    resetMut.mutate(
      { id: user.id, password },
      {
        onSuccess: () => {
          toast.success('Password reset');
          setPassword('');
          onClose();
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to reset')),
      },
    );
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password — {user.username}</DialogTitle>
        </DialogHeader>
        <Input
          type="password"
          placeholder="New password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={resetMut.isPending}>
            {resetMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const { data: me } = useCurrentUser();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<string>('');
  const [onlyActive, setOnlyActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);

  const params = {
    q: q || undefined,
    role: role || undefined,
    is_active: onlyActive,
    page,
    page_size: 25,
  };
  const { data, isLoading } = useAdminUsers(params);
  const deleteMut = useDeleteAdminUser();

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Users"
        description="Gestionar cuentas de usuario: crear, editar, resetear contraseña, desactivar o eliminar."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New user
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <SearchInput value={q} onChange={setQ} placeholder="Search username or email..." />
        </div>
        <Select
          options={[
            { value: '', label: 'All roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
          ]}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={onlyActive === true}
            onCheckedChange={(v) => setOnlyActive(v ? true : undefined)}
          />
          Active only
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableTh>Username</DataTableTh>
            <DataTableTh>Email</DataTableTh>
            <DataTableTh>Role</DataTableTh>
            <DataTableTh>Status</DataTableTh>
            <DataTableTh>Created</DataTableTh>
            <DataTableTh className="text-right">Actions</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {(data?.items ?? []).map((user) => (
              <DataTableRow key={user.id}>
                <DataTableCell className="font-medium">{user.username}</DataTableCell>
                <DataTableCell className="text-muted-foreground">{user.email}</DataTableCell>
                <DataTableCell>
                  <Badge variant="default" className="capitalize">{user.role}</Badge>
                </DataTableCell>
                <DataTableCell>
                  {user.is_active ? (
                    <Badge variant="default" className="bg-emerald-500/10 text-emerald-400">Active</Badge>
                  ) : (
                    <Badge variant="default" className="bg-muted text-muted-foreground">Inactive</Badge>
                  )}
                </DataTableCell>
                <DataTableCell className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </DataTableCell>
                <DataTableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(user)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setResetting(user)} title="Reset password">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {me?.id !== user.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete user?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {user.username} and all owned tasks/projects.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMut.mutate(user.id, {
                                  onSuccess: () => toast.success('User deleted'),
                                  onError: (err) => toast.error(extractErrorMessage(err, 'Failed')),
                                })
                              }
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {me?.id === user.id && (
                      <Button variant="ghost" size="sm" disabled title="Cannot delete yourself">
                        <UserX className="h-4 w-4 text-muted-foreground/50" />
                      </Button>
                    )}
                  </div>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}

      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.pagination.page} / {data.pagination.total_pages} ({data.pagination.total} users)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditUserDialog user={editing} onClose={() => setEditing(null)} />
      <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />
    </PageWrapper>
  );
}
