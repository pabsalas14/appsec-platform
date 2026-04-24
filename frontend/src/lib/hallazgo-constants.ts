/** Alineado a Pydantic en backend: hallazgo_sast, hallazgo_dast, etc. */

export const SEVERIDADES_HALLAZGO = ['Critica', 'Alta', 'Media', 'Baja'] as const;

export const ESTADOS_HALLAZGO_SAST_DAST = [
  'Abierto',
  'Cerrado',
  'Falso Positivo',
  'Aceptado',
  'En Remediacion',
] as const;

export const ESTADOS_HALLAZGO_PIPELINE = ['Abierto', 'Falso Positivo', 'Aceptado', 'Remediado'] as const;

export function vulnerabilidadOptions(v: { id: string; titulo: string }[] | undefined) {
  return [
    { value: '', label: 'Sin vínculo' },
    ...(v ?? [])
      .slice(0, 400)
      .map((x) => ({
        value: x.id,
        label: x.titulo.length > 70 ? `${x.titulo.slice(0, 70)}…` : x.titulo,
      })),
  ];
}
