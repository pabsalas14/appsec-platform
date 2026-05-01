'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCodeSecurityReviews } from '@/hooks/useCodeSecurityReviews';
import { cn } from '@/lib/utils';
import { CodeSecurityReview } from '@/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  date: string;
  risk: number;
  analyzed: number;
}

interface SeverityDataPoint {
  name: string;
  value: number;
  color: string;
}

interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface DashboardStats {
  total_reviews: number;
  active_analyses: number;
  critical_findings: number;
  avg_risk_score: number;
  completed_this_week: number;
}

export default function CodeSecurityReviewsDashboardPage() {
  const router = useRouter();
  const { data: reviewsData, isLoading } = useCodeSecurityReviews();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const reviews = (reviewsData || []) as CodeSecurityReview[];

  // Calculate stats
  const stats: DashboardStats = {
    total_reviews: reviews.length,
    active_analyses: reviews.filter((r) => r.estado === 'ANALYZING').length,
    critical_findings: Math.floor(Math.random() * 50), // Placeholder - would come from findings endpoint
    avg_risk_score: Math.floor(Math.random() * 100), // Placeholder - would come from aggregated data
    completed_this_week: reviews.filter((r) => {
      const createdDate = new Date(r.created_at);
      const weekAgo = new Date(new Date().setDate(new Date().getDate() - 7));
      return r.estado === 'COMPLETED' && createdDate > weekAgo;
    }).length,
  };

  // Prepare chart data - Risk trend (last 7 days)
  const last7Days: ChartDataPoint[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      risk: Math.round(Math.random() * 80 + 20),
      analyzed: Math.floor(Math.random() * 8 + 2),
    };
  });

  // Severity distribution - simulated data for now
  const severityData: SeverityDataPoint[] = [
    {
      name: 'Critical',
      value: Math.floor(reviews.length * 0.15),
      color: '#ef4444',
    },
    {
      name: 'High',
      value: Math.floor(reviews.length * 0.25),
      color: '#f97316',
    },
    {
      name: 'Medium',
      value: Math.floor(reviews.length * 0.35),
      color: '#eab308',
    },
    {
      name: 'Low',
      value: Math.floor(reviews.length * 0.25),
      color: '#22c55e',
    },
  ];

  // Status distribution
  const statusData: StatusDataPoint[] = [
    {
      name: 'Completed',
      value: reviews.filter((r) => r.estado === 'COMPLETED').length,
      color: '#10b981',
    },
    {
      name: 'Analyzing',
      value: reviews.filter((r) => r.estado === 'ANALYZING').length,
      color: '#3b82f6',
    },
    {
      name: 'Pending',
      value: reviews.filter((r) => r.estado === 'PENDING').length,
      color: '#8b5cf6',
    },
    {
      name: 'Failed',
      value: reviews.filter((r) => r.estado === 'FAILED').length,
      color: '#ef4444',
    },
  ];

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (selectedStatus && review.estado !== selectedStatus) return false;
    return true;
  });

  // Sort by creation date
  const sortedReviews = [...filteredReviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Code Security Reviews</h1>
            <p className="text-muted-foreground">Monitor and analyze code security threats</p>
          </div>
          <Button
            onClick={() => router.push('/code_security_reviews/new')}
            className="bg-primary hover:bg-primary/90"
          >
            + New Review
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total_reviews}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{stats.active_analyses}</p>
                <p className="text-sm text-muted-foreground">Active Analyses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{stats.critical_findings}</p>
                <p className="text-sm text-muted-foreground">Total Findings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">{stats.avg_risk_score}%</p>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{stats.completed_this_week}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Trend Chart */}
          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardHeader>
              <CardTitle>Risk Trend (7 Days)</CardTitle>
              <CardDescription>Average risk scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Risk Score"
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="analyzed"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Analyzed"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardHeader>
              <CardTitle>Analysis Status</CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Severity Distribution */}
          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>By severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[8, 8, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Finding Statistics */}
          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardHeader>
              <CardTitle>Quick Statistics</CardTitle>
              <CardDescription>Key metrics breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-semibold text-green-400">
                    {reviews.filter((r) => r.estado === 'COMPLETED').length}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        reviews.length > 0
                          ? (reviews.filter((r) => r.estado === 'COMPLETED').length / reviews.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Analyzing</span>
                  <span className="font-semibold text-blue-400">
                    {reviews.filter((r) => r.estado === 'ANALYZING').length}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        reviews.length > 0
                          ? (reviews.filter((r) => r.estado === 'ANALYZING').length / reviews.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-semibold text-red-400">
                    {reviews.filter((r) => r.estado === 'FAILED').length}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${
                        reviews.length > 0
                          ? (reviews.filter((r) => r.estado === 'FAILED').length / reviews.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews Table */}
        <Card className="border-white/[0.1] bg-white/[0.02]">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>Latest code security analyses</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value || null)}
                  className="px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground text-sm"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ANALYZING">Analyzing</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.1]">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Repository</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Branch</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReviews.length > 0 ? (
                    sortedReviews.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => router.push(`/code_security_reviews/${review.id}`)}
                      >
                        <td className="py-3 px-4 font-medium text-foreground">{review.titulo}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono truncate max-w-xs">
                          {review.url_repositorio || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-foreground">{review.rama_analizar}</td>
                        <td className="py-3 px-4">
                          <div className="w-20 bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                              style={{ width: `${review.progreso}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{review.progreso}%</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium',
                              review.estado === 'COMPLETED' && 'bg-green-500/20 text-green-400',
                              review.estado === 'ANALYZING' && 'bg-blue-500/20 text-blue-400',
                              review.estado === 'PENDING' && 'bg-purple-500/20 text-purple-400',
                              review.estado === 'FAILED' && 'bg-red-500/20 text-red-400'
                            )}
                          >
                            {review.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(review.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/code_security_reviews/${review.id}`);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No reviews found. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
