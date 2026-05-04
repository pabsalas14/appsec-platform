'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Plus, Save, CheckCircle } from 'lucide-react';

import api from '@/lib/api';

type RiskScoringConfig = {
  id: string;
  nombre_config: string;
  weight_hidden_commits: number;
  weight_timing_anomalies: number;
  weight_critical_files: number;
  weight_mass_changes: number;
  weight_author_anomalies: number;
  weight_rapid_succession: number;
  weight_force_push: number;
  weight_dependency_changes: number;
  weight_external_merges: number;
  activa: boolean;
  created_at: string;
};

interface CreateConfigBody {
  nombre_config: string;
  weight_hidden_commits: number;
  weight_timing_anomalies: number;
  weight_critical_files: number;
  weight_mass_changes: number;
  weight_author_anomalies: number;
  weight_rapid_succession: number;
  weight_force_push: number;
  weight_dependency_changes: number;
  weight_external_merges: number;
}

const DEFAULT_CONFIG: CreateConfigBody = {
  nombre_config: '',
  weight_hidden_commits: 10,
  weight_timing_anomalies: 15,
  weight_critical_files: 20,
  weight_mass_changes: 15,
  weight_author_anomalies: 15,
  weight_rapid_succession: 10,
  weight_force_push: 25,
  weight_dependency_changes: 20,
  weight_external_merges: 15,
};

const WEIGHT_FIELDS = [
  { key: 'weight_critical_files', label: 'Critical Files' },
  { key: 'weight_force_push', label: 'Force Push' },
  { key: 'weight_timing_anomalies', label: 'Timing Anomalies' },
  { key: 'weight_dependency_changes', label: 'Dependency Changes' },
  { key: 'weight_external_merges', label: 'External Merges' },
  { key: 'weight_hidden_commits', label: 'Hidden Commits' },
  { key: 'weight_mass_changes', label: 'Mass Changes' },
  { key: 'weight_author_anomalies', label: 'Author Anomalies' },
  { key: 'weight_rapid_succession', label: 'Rapid Succession' },
];

export default function RiskScoringAdminPage() {
  const queryClient = useQueryClient();
  const [newConfig, setNewConfig] = useState<CreateConfigBody>(DEFAULT_CONFIG);
  const [isCreating, setIsCreating] = useState(false);
  const [weightValues, setWeightValues] = useState<Record<string, number>>({
    weight_critical_files: 20,
    weight_force_push: 25,
    weight_timing_anomalies: 15,
    weight_dependency_changes: 20,
    weight_external_merges: 15,
    weight_hidden_commits: 10,
    weight_mass_changes: 15,
    weight_author_anomalies: 15,
    weight_rapid_succession: 10,
  });

  const { data: configs, isLoading } = useQuery<RiskScoringConfig[]>({
    queryKey: ['admin', 'risk-scoring'],
    queryFn: async () => {
      const { data } = await api.get('/admin/risk-scoring');
      return data.data || data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (config: CreateConfigBody) => {
      const { data } = await api.post('/admin/risk-scoring', config);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'risk-scoring'] });
      setIsCreating(false);
      setNewConfig(DEFAULT_CONFIG);
      setWeightValues({
        weight_critical_files: 20,
        weight_force_push: 25,
        weight_timing_anomalies: 15,
        weight_dependency_changes: 20,
        weight_external_merges: 15,
        weight_hidden_commits: 10,
        weight_mass_changes: 15,
        weight_author_anomalies: 15,
        weight_rapid_succession: 10,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/risk-scoring/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'risk-scoring'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/admin/risk-scoring/${id}/activate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'risk-scoring'] });
    },
  });

  const handleSave = () => {
    createMutation.mutate({ ...newConfig, ...weightValues });
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Risk Scoring Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Configure custom risk scoring weights for the Detective Agent analysis.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Configurations</span>
            <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Configuration
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configs?.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No configurations yet. Create one to customize risk scoring.
            </p>
          ) : (
            <div className="space-y-3">
              {configs?.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.nombre_config}</span>
                      {config.activa && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Critical Files: {config.weight_critical_files} | Force Push: {config.weight_force_push} | Timing: {config.weight_timing_anomalies}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!config.activa && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => activateMutation.mutate(config.id)}
                        disabled={activateMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(config.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Configuration Name</label>
              <input
                type="text"
                value={newConfig.nombre_config}
                onChange={(e) => setNewConfig((prev) => ({ ...prev, nombre_config: e.target.value }))}
                placeholder="e.g., Production Environment"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {WEIGHT_FIELDS.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <label className="text-xs">{label}: {weightValues[key]}</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-8 w-8 rounded border flex items-center justify-center"
                      onClick={() => setWeightValues((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 5) }))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={weightValues[key] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setWeightValues((prev) => ({ ...prev, [key]: Math.min(100, Math.max(0, val)) }));
                      }}
                      className="h-8 w-16 text-center rounded border px-2"
                      min={0}
                      max={100}
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded border flex items-center justify-center"
                      onClick={() => setWeightValues((prev) => ({ ...prev, [key]: Math.min(100, (prev[key] || 0) + 5) }))}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={!newConfig.nombre_config || createMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}