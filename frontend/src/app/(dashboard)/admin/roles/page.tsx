"use client";

import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  Card,
  CardContent,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  PageHeader,
  PageWrapper,
} from '@/components/ui';
import {
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useUpdateRole,
} from '@/hooks/useRoles';
import { cn, extractErrorMessage } from '@/lib/utils';
import type { Role } from '@/types';

function groupPermissions(codes: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const code of codes) {
    const [group] = code.split('.');
    if (!groups[group]) groups[group] = [];
    groups[group].push(code);
  }
  return groups;
}

function RoleDialog({
  role,
  open,
  onOpenChange,
}: {
  role?: Role;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: permissions } = usePermissions();
  const createMut = useCreateRole();
  const updateMut = useUpdateRole();
  const isEdit = !!role;

  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissions ?? []));

  const grouped = useMemo(() => groupPermissions((permissions ?? []).map((p) => p.code)), [permissions]);

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code); else next.add(code);
    setSelected(next);
  };

  const pending = createMut.isPending || updateMut.isPending;

  const save = () => {
    if (!name.trim() && !isEdit) {
      toast.error('Name is required');
      return;
    }
    const payload = {
      description,
      permissions: Array.from(selected),
    };
    const op = isEdit
      ? updateMut.mutateAsync({ id: role!.id, data: payload })
      : createMut.mutateAsync({ name, ...payload });
    op.then(() => {
      toast.success(isEdit ? 'Role updated' : 'Role created');
      onOpenChange(false);
    }).catch((err) => toast.error(extractErrorMessage(err, 'Failed to save role')));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit role — ${role?.name}` : 'Create role'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isEdit && (
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="role_name" className="mt-1" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this role do?"
              className="mt-1"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Permissions</label>
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            </div>
            <div className="max-h-[300px] space-y-4 overflow-y-auto rounded-lg border border-border p-3">
              {Object.entries(grouped).map(([group, codes]) => (
                <div key={group}>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {codes.map((code) => {
                      const active = selected.has(code);
                      return (
                        <button
                          type="button"
                          key={code}
                          onClick={() => toggle(code)}
                          className={cn(
                            'flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
                            active
                              ? 'border-primary/50 bg-primary/10 text-foreground'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span className="font-mono">{code}</span>
                          <span>{active ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRolesPage() {
  const { data: roles, isLoading } = useRoles();
  const deleteMut = useDeleteRole();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Roles & Permissions"
        description="Demo M:N del framework. Los permisos se siembran desde app/core/permissions.py y son editables aquí."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New role
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(roles ?? []).map((role) => (
            <Card key={role.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <h3 className="truncate text-base font-semibold">{role.name}</h3>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {role.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {role.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No permissions</span>
                  ) : (
                    role.permissions.slice(0, 8).map((p) => (
                      <Badge key={p} variant="default" className="bg-muted text-xs">
                        {p}
                      </Badge>
                    ))
                  )}
                  {role.permissions.length > 8 && (
                    <Badge variant="default" className="bg-muted text-xs">
                      +{role.permissions.length - 8}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(role)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete role?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You cannot delete the built-in admin/user roles.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteMut.mutate(role.id, {
                              onSuccess: () => toast.success('Role deleted'),
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoleDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing && (
        <RoleDialog role={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </PageWrapper>
  );
}
