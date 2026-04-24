"use client";

import {
  Activity,
  CheckCircle2,
  Circle,
  ListTodo,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { BarChartCard, DonutChartCard, LineChartCard } from '@/components/charts';
import { HierarchyFiltersBar } from '@/components/dashboard/HierarchyFiltersBar';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  PageWrapper,
  StatCard,
} from '@/components/ui';
import {
  useDashboardReleases,
  useDashboardTeam,
  useDashboardExecutive,
  useDashboardVulnerabilities,
} from '@/hooks/useAppDashboardPanels';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDashboardHierarchyFilters } from '@/hooks/useDashboardHierarchyFilters';
import { useMyDashboardVisibility } from '@/hooks/useDashboardConfigs';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function DashboardHomePage() {
  const { data: user } = useCurrentUser();
  const { data: stats, isLoading } = useDashboardStats();
  const { filters, updateFilter, clearFilters } = useDashboardHierarchyFilters();
  const { data: exec, isLoading: execLoading } = useDashboardExecutive(filters);
  const { data: vulnDash, isLoading: vulnDashLoading } = useDashboardVulnerabilities(filters);
  const { data: releasesDash, isLoading: releasesLoading } = useDashboardReleases(filters);
  const { data: teamDash, isLoading: teamLoading } = useDashboardTeam(filters);
  const { data: visibility } = useMyDashboardVisibility('home');

  const isAdmin = user?.role === 'admin';
  const isWidgetVisible = (widgetId: string) =>
    visibility?.widgets?.[widgetId]?.visible ?? visibility?.default_visible ?? true;

  return (
    <PageWrapper className="space-y-6 p-6">
      <PageHeader
        title={`Welcome, ${user?.full_name ?? user?.username ?? ''}`}
        description={
          isAdmin
            ? 'Resumen global del sistema — métricas agregadas de todos los usuarios.'
            : 'Resumen personal — tus tareas, proyectos y actividad reciente.'
        }
      />

      <HierarchyFiltersBar filters={filters} onChange={updateFilter} onClear={clearFilters} />

      {/* ─── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={stats?.totals.tasks ?? (isLoading ? '…' : 0)}
          icon={ListTodo}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          label="Completed"
          value={stats?.totals.completed_tasks ?? (isLoading ? '…' : 0)}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          label="Pending"
          value={stats?.totals.pending_tasks ?? (isLoading ? '…' : 0)}
          icon={Circle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
        />
        <StatCard
          label={isAdmin ? 'Active users' : 'Your status'}
          value={
            isAdmin ? (stats?.totals.active_users ?? (isLoading ? '…' : 0)) : 'Active'
          }
          icon={isAdmin ? UserCheck : ShieldCheck}
          iconColor="text-sky-400"
          iconBg="bg-sky-500/10"
        />
      </div>

      {/* ─── AppSec panels (BRD dashboards) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isWidgetVisible('dashboard.home.card.appsec.total_vulnerabilities') && (
          <StatCard
            label="Vulnerabilidades (total)"
            value={
              vulnDash?.total_vulnerabilities ?? (vulnDashLoading ? '…' : 0)
            }
            icon={ShieldCheck}
            iconColor="text-rose-400"
            iconBg="bg-rose-500/10"
          />
        )}
        {isWidgetVisible('dashboard.home.card.appsec.critical_count') && (
          <StatCard
            label="Críticas (KPI)"
            value={exec?.kpis.critical_count ?? (execLoading ? '…' : 0)}
            icon={ShieldCheck}
            iconColor="text-orange-400"
            iconBg="bg-orange-500/10"
          />
        )}
        {isWidgetVisible('dashboard.home.card.appsec.overdue_sla') && (
          <StatCard
            label="Vencidas SLA (panel)"
            value={vulnDash?.overdue_count ?? (vulnDashLoading ? '…' : 0)}
            icon={Circle}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/10"
          />
        )}
        {isWidgetVisible('dashboard.home.card.appsec.risk_level') && (
          <StatCard
            label="Riesgo (ejecutivo)"
            value={exec?.risk_level ?? (execLoading ? '…' : '—')}
            icon={ShieldCheck}
            iconColor="text-violet-400"
            iconBg="bg-violet-500/10"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Equipo (analistas)"
          value={teamDash?.team_size ?? (teamLoading ? '…' : 0)}
          icon={Users}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
        />
        <StatCard
          label="Releases (total)"
          value={releasesDash?.total_releases ?? (releasesLoading ? '…' : 0)}
          icon={ListTodo}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          label="Releases en progreso"
          value={releasesDash?.in_progress ?? (releasesLoading ? '…' : 0)}
          icon={Activity}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
        />
        <StatCard
          label="Pendientes aprobación"
          value={releasesDash?.pending_approval ?? (releasesLoading ? '…' : 0)}
          icon={Circle}
          iconColor="text-fuchsia-400"
          iconBg="bg-fuchsia-500/10"
        />
      </div>

      {/* ─── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChartCard
          title="Task breakdown"
          subtitle="Completed vs pending"
          data={(stats?.task_breakdown ?? []).map((t) => ({
            name: t.status,
            value: t.count,
          }))}
        />
        {isAdmin ? (
          <BarChartCard
            title="Users by role"
            subtitle="Distribution of active roles"
            data={stats?.users_by_role ?? []}
            xKey="role"
            dataKey="count"
          />
        ) : (
          <BarChartCard
            title="Your tasks"
            subtitle="Completed vs pending"
            data={stats?.task_breakdown ?? []}
            xKey="status"
            dataKey="count"
          />
        )}
      </div>

      {/* ─── Activity chart ── */}
      <LineChartCard
        title="Activity (last 14 days)"
        subtitle={isAdmin ? 'Mutations across the system' : 'Your audit trail'}
        data={(stats?.activity ?? []).map((a) => ({
          day: a.day ? new Date(a.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '',
          count: a.count,
        }))}
        xKey="day"
        dataKey="count"
      />

      {/* ─── Recent activity (admin only) ── */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" /> Recent activity
              </CardTitle>
              <div className="text-xs text-muted-foreground">Latest audit log entries</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(stats?.recent_audit_logs ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No recent activity.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(stats?.recent_audit_logs ?? []).map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                    <Badge
                      variant="default"
                      className={
                        entry.status === 'failure'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }
                    >
                      {entry.action}
                    </Badge>
                    <div className="flex-1 truncate text-sm">
                      <span className="text-muted-foreground">{entry.entity_type ?? '—'}</span>
                      {entry.entity_id && (
                        <span className="ml-1 font-mono text-xs text-muted-foreground/70">
                          #{entry.entity_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.ts), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Admin-only welcome hint ── */}
      {!isAdmin && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Tip</div>
              <div className="text-xs text-muted-foreground">
                Contact your administrator to request elevated permissions, create new users,
                or browse audit logs.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
