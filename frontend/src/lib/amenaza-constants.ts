/** Alineado con `backend/app/schemas/amenaza.py` */
export const CATEGORIAS_STRIDE = [
  'Spoofing',
  'Tampering',
  'Repudiation',
  'Information Disclosure',
  'Denial of Service',
  'Elevation of Privilege',
] as const;

export const ESTADOS_AMENAZA = ['Abierta', 'Mitigada', 'Aceptada', 'Transferida', 'En Revision'] as const;
