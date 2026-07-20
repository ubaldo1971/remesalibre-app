# Consolidación de RemesaLibre

## Objetivo

Este repositorio reúne las tres copias locales de RemesaLibre sin modificar ni eliminar los originales.

## Fuentes incorporadas

| Fuente | Papel en la consolidación |
|---|---|
| `Remesa antigravity` | Base funcional activa: frontend React y backend Express |
| `RemesaLibre2` | Prototipo UX independiente y documentación de diseño |
| `Remesa_antigravity_backup_2` | Recuperación selectiva de archivos ausentes en la base activa |
| `ubaldo1971/remesalibre-app` | Historial Git y remoto oficial; estaba prácticamente vacío |

## Estructura

- `/src`: frontend activo procedente de `Remesa antigravity`.
- `/server`: backend activo procedente de `Remesa antigravity`.
- `/prototypes/remesalibre2-ux`: segunda propuesta de experiencia, ejecutable de forma independiente.
- `/docs/ux-reference-remesalibre2`: decisiones y flujos de diseño recuperados de `RemesaLibre2`.
- `/archive/recovered-from-backup-2`: archivos exclusivos de la copia histórica; no forman parte del build activo.
- `/docs/paychat`: contexto arquitectónico de PayChat. No existe implementación de PayChat todavía.

## Archivos excluidos por seguridad

No se incorporaron ni deben versionarse:

- `.env` y `server/.env`.
- `confirm_otp.json`, `register.json`, `token_response.json` y `verify.json`.
- `server/src/data/db.json`, porque contiene usuarios, teléfonos, correos, PIN, CLABE y transacciones locales.
- `node_modules`, builds, logs y resultados generados.

Los archivos `.env.example` sí se conservan porque contienen únicamente plantillas.

## Diferencias de la copia histórica

La comparación entre `Remesa antigravity` y `Remesa_antigravity_backup_2` encontró 136 rutas comunes: 126 idénticas y 10 modificadas. La versión más reciente contiene 34 archivos adicionales. La copia histórica conserva cuatro archivos ausentes en la versión reciente, recuperados bajo `/archive/recovered-from-backup-2`:

- `src/pages/Admin/AdminDashboard.jsx`
- `src/pages/Admin/AdminDashboard.css`
- `src/pages/DatabaseView.jsx`
- `src/pages/DatabaseView.css`

Estos archivos se preservan como evidencia. No se activarán como rutas hasta revisar autenticación, autorización administrativa y compatibilidad con el frontend actual.

## Regla de producto

RemesaLibre será el Core y la fuente oficial del estado financiero. PayChat será posteriormente un canal conversacional que consumirá contratos versionados de RemesaLibre; no duplicará ledger, balances, autorizaciones ni ejecución financiera.

## Estado de esta rama

La rama `integration/unify-local-versions` es una rama de integración local. No debe fusionarse en `main` ni publicarse hasta completar el escaneo de secretos, instalación, build, arranque del backend y revisión de las diferencias recuperadas.
