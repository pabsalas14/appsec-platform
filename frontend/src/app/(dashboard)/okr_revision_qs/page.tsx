'use client';

import { useOkrRevisionQs } from '@/hooks/useOkrRevisionQs';

export default function OkrRevisionQsPage() {
  const { data, isLoading, error } = useOkrRevisionQs();

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error loading okr_revision_qs</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">OkrRevisionQs</h1>
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
