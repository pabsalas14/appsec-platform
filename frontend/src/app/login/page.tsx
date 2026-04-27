"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn } from 'lucide-react';
import api from '@/lib/api';
import { extractErrorMessage } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { username, password });
      router.push('/');
    } catch (err) {
      setError(extractErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to the Plataforma AppSec
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                         ring-offset-background placeholder:text-muted-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                         transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
                         ring-offset-background placeholder:text-muted-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                         transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium
                       text-primary-foreground shadow-sm transition-colors
                       hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Sign in
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Default: <code className="text-foreground/70">admin</code> / <code className="text-foreground/70">Changeme123!</code>
        </p>
      </div>
    </div>
  );
}
