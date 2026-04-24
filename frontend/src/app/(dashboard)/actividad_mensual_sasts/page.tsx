'use client';

import { useActividadMensualSasts } from '@/hooks/useActividadMensualSasts';

export default function ActividadMensualSastsPage() {
  const { data, isLoading, error } = useActividadMensualSasts();

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error loading actividad_mensual_sasts</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">ActividadMensualSasts</h1>
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
