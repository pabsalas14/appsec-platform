'use client';

import { useHallazgoPipelines } from '@/hooks/useHallazgoPipelines';

export default function HallazgoPipelinesPage() {
  const { data, isLoading, error } = useHallazgoPipelines();

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error loading hallazgo_pipelines</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">HallazgoPipelines</h1>
      <ul className="space-y-2">
        {data?.map((item) => (
          <li key={item.id} className="border rounded px-3 py-2">
            <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
