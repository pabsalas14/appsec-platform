# P14 — Pipeline (§10.2) y SCA / empresa única

- **C2** ya cubre: `scan_id` + rama, import hallazgos y match con `pipeline_releases` (incl. validación de fila vacía en CSV).  
- **Matices de data quality (SCA, empresa global):** dependen de normalización de activos (un solo `repositorio` / activo) y de reglas de negocio en import — validar con datos reales; no requiere rama de código adicional mientras las columnas y match estén alineados al `plantilla.csv`.  
- **Recomendación operativa:** al importar, exigir `scan_id` y `branch` no vacíos; el API ya omite filas sin esos campos.
