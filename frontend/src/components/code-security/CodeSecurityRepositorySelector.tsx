'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Repository {
  name: string;
  url: string;
  owner: string;
  description?: string;
  stars?: number;
  updated_at?: string;
}

interface CodeSecurityRepositorySelectorProps {
  selectedUrl: string;
  onSelect: (url: string, repo: Repository) => void;
}

export function CodeSecurityRepositorySelector({
  selectedUrl,
  onSelect,
}: CodeSecurityRepositorySelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [githubUsername, setGithubUsername] = useState('');

  // Fetch repos for a given GitHub username
  const handleFetchRepos = async () => {
    if (!githubUsername.trim()) {
      toast.error('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    try {
      // Call backend endpoint that lists repos via GitHub API
      const response = await api.get(`/code_security_reviews/github/repos?username=${githubUsername}`);
      const repoData = response.data.data as Repository[];
      setRepos(repoData);

      if (repoData.length === 0) {
        toast.warning('No repositories found for this user');
      } else {
        toast.success(`Found ${repoData.length} repositories`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Failed to fetch repositories');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter repos based on search term
  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* GitHub Username Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter GitHub username or organization"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleFetchRepos()}
          disabled={loading}
        />
        <Button
          onClick={handleFetchRepos}
          disabled={loading || !githubUsername.trim()}
          className="min-w-32"
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Search Filter */}
      {repos.length > 0 && (
        <Input
          placeholder="Filter repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {/* Repository List */}
      {repos.length > 0 && (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredRepos.map((repo) => (
            <button
              key={repo.url}
              onClick={() => onSelect(repo.url, repo)}
              className={cn(
                'text-left p-3 rounded-lg border transition-all',
                selectedUrl === repo.url
                  ? 'border-primary bg-primary/10'
                  : 'border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08]'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    {repo.owner}/{repo.name}
                    {selectedUrl === repo.url && (
                      <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                        ✓ Selected
                      </span>
                    )}
                  </p>
                  {repo.description && (
                    <p className="text-xs text-muted-foreground mt-1">{repo.description}</p>
                  )}
                </div>
                {repo.stars !== undefined && (
                  <div className="text-xs text-muted-foreground ml-2">⭐ {repo.stars}</div>
                )}
              </div>
              {repo.updated_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Updated: {new Date(repo.updated_at).toLocaleDateString()}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {repos.length === 0 && !loading && githubUsername && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No repositories found</p>
        </div>
      )}

      {/* Help Text */}
      {repos.length === 0 && !loading && !githubUsername && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Enter a GitHub username to browse repositories</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Fetching repositories...</p>
        </div>
      )}
    </div>
  );
}
