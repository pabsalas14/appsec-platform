'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Branch {
  name: string;
  is_default: boolean;
  last_commit?: {
    sha: string;
    date: string;
    message: string;
  };
}

interface CodeSecurityBranchPickerProps {
  repositoryUrl: string;
  selectedBranch: string;
  onSelect: (branch: string) => void;
}

export function CodeSecurityBranchPicker({
  repositoryUrl,
  selectedBranch,
  onSelect,
}: CodeSecurityBranchPickerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch branches when repository URL changes
  useEffect(() => {
    if (!repositoryUrl) {
      setBranches([]);
      return;
    }

    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/code_security_reviews/github/branches', {
          params: { repo_url: repositoryUrl },
        });
        const branchData = response.data.data as Branch[];
        setBranches(branchData);

        // Auto-select main branch if available, otherwise select first branch
        const defaultBranch = branchData.find((b) => b.is_default) || branchData[0];
        if (defaultBranch) {
          onSelect(defaultBranch.name);
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to fetch branches');
        toast.error('Could not fetch branches from repository');
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [repositoryUrl, onSelect]);

  if (!repositoryUrl) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">Select a repository first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Fetching branches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Branch Dropdown */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Available Branches ({branches.length})
        </label>
        {branches.length > 0 ? (
          <select
            value={selectedBranch}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white/[0.05] border border-white/[0.1] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {branches.map((branch) => (
              <option key={branch.name} value={branch.name}>
                {branch.name}
                {branch.is_default ? ' (default)' : ''}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No branches found
          </div>
        )}
      </div>

      {/* Branch Details */}
      {selectedBranch && branches.length > 0 && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          {(() => {
            const selected = branches.find((b) => b.name === selectedBranch);
            return (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">Branch: {selectedBranch}</p>
                {selected?.last_commit && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Latest Commit:</span>
                      <p className="font-mono text-xs mt-1 text-foreground">
                        {selected.last_commit.sha.slice(0, 7)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Message:</span>
                      <p className="text-foreground mt-1">
                        {selected.last_commit.message.slice(0, 100)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>
                      <p className="text-foreground mt-1">
                        {new Date(selected.last_commit.date).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
