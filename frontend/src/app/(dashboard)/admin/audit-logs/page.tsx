"use client";

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableRow,
  DataTableTh,
  DateRangePicker,
  Input,
  PageHeader,
  PageWrapper,
  Select,
} from '@/components/ui';
import { useAuditLogs } from '@/hooks/useAuditLogs';

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'user.create', label: 'user.create' },
  { value: 'user.update', label: 'user.update' },
  { value: 'user.delete', label: 'user.delete' },
  { value: 'user.password_reset', label: 'user.password_reset' },
  { value: 'task.create', label: 'task.create' },
  { value: 'task.update', label: 'task.update' },
  { value: 'task.delete', label: 'task.delete' },
  { value: 'project.create', label: 'project.create' },
  { value: 'project.update', label: 'project.update' },
  { value: 'project.delete', label: 'project.delete' },
  { value: 'role.create', label: 'role.create' },
  { value: 'role.update', label: 'role.update' },
  { value: 'role.delete', label: 'role.delete' },
  { value: 'system_setting.update', label: 'system_setting.update' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'users', label: 'users' },
  { value: 'tasks', label: 'tasks' },
  { value: 'projects', label: 'projects' },
  { value: 'roles', label: 'roles' },
  { value: 'system_settings', label: 'system_settings' },
];

function toIsoDay(yyyymmdd: string | undefined, endOfDay = false): string | undefined {
  if (!yyyymmdd) return undefined;
  return endOfDay ? `${yyyymmdd}T23:59:59Z` : `${yyyymmdd}T00:00:00Z`;
}

export default function AdminAuditLogsPage() {
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    action: action || undefined,
    entity_type: entity || undefined,
    actor_user_id: actorId || undefined,
    since: toIsoDay(from),
    until: toIsoDay(to, true),
    page,
    page_size: 50,
  };

  const { data, isLoading, isFetching, refetch } = useAuditLogs(params);

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title="Audit Logs"
        description="Read-only trail of every mutation in the system. Useful for compliance and incident investigation."
      >
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-muted-foreground">Action</label>
            <Select className="mt-1" value={action} onChange={(e) => setAction(e.target.value)} options={ACTION_OPTIONS} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-muted-foreground">Entity</label>
            <Select className="mt-1" value={entity} onChange={(e) => setEntity(e.target.value)} options={ENTITY_OPTIONS} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-muted-foreground">Actor user UUID</label>
            <Input className="mt-1" value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="Optional UUID" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">Date range</label>
            <div className="mt-1">
              <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable>
          <DataTableHead>
            <DataTableTh className="w-[180px]">Time</DataTableTh>
            <DataTableTh>Action</DataTableTh>
            <DataTableTh>Entity</DataTableTh>
            <DataTableTh>Actor</DataTableTh>
            <DataTableTh>Status</DataTableTh>
            <DataTableTh>Request ID</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {(data?.items ?? []).map((entry) => (
              <DataTableRow key={entry.id}>
                <DataTableCell>
                  <div className="text-xs text-foreground">
                    {format(parseISO(entry.ts), 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(parseISO(entry.ts), { addSuffix: true })}
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant="default" className="bg-primary/10 text-primary">
                    {entry.action}
                  </Badge>
                </DataTableCell>
                <DataTableCell className="text-xs text-muted-foreground">
                  <div>{entry.entity_type ?? '—'}</div>
                  {entry.entity_id && (
                    <div className="font-mono text-[11px] text-muted-foreground/70">
                      {entry.entity_id.slice(0, 12)}…
                    </div>
                  )}
                </DataTableCell>
                <DataTableCell className="text-xs">
                  {entry.actor_user_id ? (
                    <span className="font-mono">{entry.actor_user_id.slice(0, 8)}…</span>
                  ) : (
                    <span className="text-muted-foreground">system</span>
                  )}
                </DataTableCell>
                <DataTableCell>
                  <Badge
                    variant="default"
                    className={
                      entry.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-destructive/10 text-destructive'
                    }
                  >
                    {entry.status}
                  </Badge>
                </DataTableCell>
                <DataTableCell className="font-mono text-xs text-muted-foreground">
                  {entry.request_id?.slice(0, 8) ?? '—'}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}

      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.pagination.page} / {data.pagination.total_pages} ({data.pagination.total} entries)
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
    </PageWrapper>
  );
}
