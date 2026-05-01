'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCodeSecurityReviews } from '@/hooks/useCodeSecurityReviews';
import { cn } from '@/lib/utils';
import { CodeSecurityReview } from '@/types';

interface FilterState {
  searchQuery: string;
  status: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: 'date' | 'status' | 'title';
  sortOrder: 'asc' | 'desc';
}

export default function CodeSecurityReviewHistoryPage() {
  const router = useRouter();
  const { data: reviewsData, isLoading } = useCodeSecurityReviews();

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: null,
    dateFrom: null,
    dateTo: null,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const reviews = useMemo(
    () => (reviewsData || []) as CodeSecurityReview[],
    [reviewsData]
  );

  // Apply filters
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = review.titulo.toLowerCase().includes(query);
        const matchesRepo = (review.url_repositorio || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesRepo) {
          return false;
        }
      }

      // Status filter
      if (filters.status && review.estado !== filters.status) {
        return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const reviewDate = new Date(review.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (reviewDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const reviewDate = new Date(review.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (reviewDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, filters]);

  // Sort results
  const sortedReviews = useMemo(() => {
    const sorted = [...filteredReviews];

    sorted.sort((a, b) => {
      let compareValue = 0;

      switch (filters.sortBy) {
        case 'title':
          compareValue = a.titulo.localeCompare(b.titulo);
          break;
        case 'status':
          compareValue = a.estado.localeCompare(b.estado);
          break;
        case 'date':
        default:
          compareValue = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }

      return filters.sortOrder === 'desc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [filteredReviews, filters.sortBy, filters.sortOrder]);

  const handleReset = () => {
    setFilters({
      searchQuery: '',
      status: null,
      dateFrom: null,
      dateTo: null,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Review History</h1>
          <p className="text-muted-foreground">Search and filter all code security reviews</p>
        </div>

        {/* Search & Filter Card */}
        <Card className="border-white/[0.1] bg-white/[0.02] mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Forensic Search & Filter</CardTitle>
            <CardDescription>Advanced search capabilities to find specific reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search Query */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Search by Title or Repository
                </label>
                <input
                  type="text"
                  placeholder="Enter title or repository URL..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        status: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="ANALYZING">Analyzing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateFrom: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateTo: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sortBy: e.target.value as 'date' | 'status' | 'title',
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sortOrder: e.target.value as 'asc' | 'desc',
                      })
                    }
                    className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Counter */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{sortedReviews.length}</span> of{' '}
          <span className="font-semibold text-foreground">{reviews.length}</span> reviews
        </div>

        {/* Results Table */}
        <Card className="border-white/[0.1] bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Review Records</CardTitle>
            <CardDescription>Complete history of all code security reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.1]">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Repository</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Branch</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progress</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReviews.length > 0 ? (
                    sortedReviews.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-foreground max-w-xs truncate">
                          {review.titulo}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono truncate max-w-xs">
                          {review.url_repositorio || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-foreground">{review.rama_analizar}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium inline-block',
                              review.estado === 'COMPLETED' && 'bg-green-500/20 text-green-400',
                              review.estado === 'ANALYZING' && 'bg-blue-500/20 text-blue-400',
                              review.estado === 'PENDING' && 'bg-purple-500/20 text-purple-400',
                              review.estado === 'FAILED' && 'bg-red-500/20 text-red-400'
                            )}
                          >
                            {review.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/10 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${review.progreso}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-8">
                              {review.progreso}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: '2-digit',
                            month: '2-digit',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/code_security_reviews/${review.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        {reviews.length === 0
                          ? 'No reviews found. Create one to get started!'
                          : 'No reviews match your search criteria. Try adjusting your filters.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {reviews.filter((r) => r.estado === 'COMPLETED').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {reviews.filter((r) => r.estado === 'ANALYZING').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Analyzing</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {reviews.filter((r) => r.estado === 'PENDING').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.1] bg-white/[0.02]">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {reviews.filter((r) => r.estado === 'FAILED').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
