import { z } from 'zod';

/** Respuesta de `POST /vulnerabilidads/{id}/ia/triage-fp` (validación en cliente). */
export const VulnerabilidadIATriageResponseSchema = z.object({
  provider: z.string(),
  model: z.string(),
  dry_run: z.boolean(),
  verdict: z.enum(['false_positive', 'likely_real', 'needs_review']),
  confidence: z.number(),
  rationale: z.string(),
  suggested_state: z.string().nullable().optional(),
  raw_content: z.string(),
});

export type VulnerabilidadIATriageResponse = z.infer<typeof VulnerabilidadIATriageResponseSchema>;
