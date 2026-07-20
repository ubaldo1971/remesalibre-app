# AGENTS.md

## Alcance

Estas instrucciones aplican a todo el repositorio RemesaLibre.

## Fuente canónica

- El código activo vive en `/src` y `/server`.
- `/prototypes/remesalibre2-ux` es referencia UX independiente; no debe mezclarse automáticamente con `/src`.
- `/archive/recovered-from-backup-2` conserva evidencia histórica y no forma parte del build.
- Las tres carpetas originales fuera de este repositorio no deben modificarse ni eliminarse durante la consolidación.

## Seguridad

- Nunca versionar `.env`, tokens, OTP, respuestas de registro ni `server/src/data/db.json`.
- Nunca presentar la aplicación como lista para producción o capaz de mover dinero real.
- La IA no autoriza operaciones financieras.
- Todo flujo financiero nuevo necesita idempotencia, autorización determinista, auditoría y pruebas.

## Verificación mínima

Antes de integrar cambios:

```bash
npm ci
npm run build
cd server
npm install
node --check src/server.js
npm start
```

Comprobar `GET http://127.0.0.1:3000/health` y detener el servidor después.

## Git

- Trabajar en ramas; no modificar `main` directamente.
- No hacer push, merge ni despliegue sin autorización del usuario.
- Mantener commits pequeños y explicar la procedencia de cualquier código recuperado.

## PayChat

PayChat aún no está implementado. Cuando se inicie, debe consumir contratos versionados del Core RemesaLibre y no duplicar balances, ledger, autorizaciones ni estados financieros.
