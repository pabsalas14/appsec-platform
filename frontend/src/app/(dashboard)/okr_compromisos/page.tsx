'use client';

import { useOkrCompromisos } from '@/hooks/useOkrCompromisos';

export default function OkrCompromisosPage() {
  const { data, isLoading, error } = useOkrCompromisos();

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error loading okr_compromisos</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">OkrCompromisos</h1>
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
