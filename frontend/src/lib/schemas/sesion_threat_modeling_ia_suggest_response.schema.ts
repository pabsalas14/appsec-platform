import { z } from 'zod';

/** Respuesta de `POST /sesion_threat_modelings/{id}/ia/suggest` (validación en cliente). */
export const SesionThreatModelingIASuggestResponseSchema = z.object({
  provider: z.string(),
  model: z.string(),
  dry_run: z.boolean(),
  content: z.string(),
  suggested_threats: z.array(z.string()),
  created_amenaza_ids: z.array(z.string()),
});

export type SesionThreatModelingIASuggestResponse = z.infer<
  typeof SesionThreatModelingIASuggestResponseSchema
>;
