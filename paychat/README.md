# PayChat Gateway

Gateway conversacional independiente para el MVP simulado de RemesaLibre.

## Límites

- No mantiene wallets, balances ni ledger.
- No autoriza operaciones por cuenta del usuario.
- Consume exclusivamente contratos versionados del Core.
- Conserva en memoria solamente contexto efímero de conversación.
- Todas las respuestas financieras están marcadas como simulación.

## Ejecutar

```bash
PAYCHAT_PORT=3001 CORE_API_URL=http://127.0.0.1:3000 npm start
```

## Pruebas

```bash
npm test
```

## Simulación local de WhatsApp

El modo local acepta eventos con forma de webhook de WhatsApp, valida
`X-Hub-Signature-256` y deposita las respuestas en una bandeja en memoria.
No contacta Meta ni teléfonos reales.

Rutas disponibles únicamente con `WHATSAPP_DEMO_ENABLED=true` fuera de
producción:

```text
GET  /webhooks/whatsapp
POST /webhooks/whatsapp
GET  /api/paychat/v1/whatsapp/outbox
```

Después de levantar Core y Gateway con dos identidades efímeras vinculadas:

```bash
WHATSAPP_APP_SECRET=el-mismo-secreto-local npm run simulate:whatsapp
```

El script ejecuta dos recorridos:

1. El número A crea y confirma una simulación de $250 MXN; A recibe el
   comprobante y B una notificación simulada.
2. El número B crea una simulación de $80 MXN y la cancela.

También reenvía el primer webhook y comprueba que el ID duplicado no produzca
otra operación. Todos los mensajes deben contener `SIMULACIÓN`.

Las identidades de canal se cargan exclusivamente desde variables de entorno,
tienen rol `user`, no se guardan en `db.json` y se desactivan forzosamente con
`NODE_ENV=production`.
```

## API

```text
GET  /health
POST /api/paychat/v1/messages
```

El endpoint de mensajes reenvía el encabezado `Authorization` al Core. Las acciones admitidas en un flujo pendiente son `confirm` y `cancel`.
