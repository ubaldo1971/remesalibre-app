# PayChat MVP Simulado — Plan de implementación

> **Para Hermes:** ejecutar este plan tarea por tarea con TDD. No hacer commits, push ni despliegues sin autorización explícita del usuario.

**Objetivo:** Construir el primer recorrido completo de PayChat: un usuario autenticado escribe “Paga 250 pesos a María por comida”, revisa un resumen, confirma explícitamente, obtiene una ejecución simulada idempotente y recibe un comprobante auditable marcado como simulación.

**Arquitectura:** RemesaLibre seguirá siendo el Core y única fuente oficial de identidad financiera, payment intents, autorización, estados y auditoría. PayChat será un gateway conversacional separado que interpreta mensajes y consume contratos HTTP versionados del Core. La UI web será el primer canal; WhatsApp se añadirá después como otro adaptador del mismo gateway.

**Stack:** Node.js ESM, Express, JWT existente, pruebas `node:test`, React, React Router, Zustand, Vite. Sin dependencias nuevas para el primer incremento.

---

## 1. Alcance cerrado del primer incremento

### Incluido

- Canal web `/paychat`.
- Usuario autenticado con el JWT existente.
- Beneficiarios demo no sensibles y no persistidos en `db.json`.
- Parser determinista en español.
- Intención `send_payment` en MXN.
- Creación de `payment_intent` mediante `/api/v1`.
- Confirmación y cancelación explícitas.
- Idempotencia en creación y confirmación.
- Cotización con comisión `$0` para P2P MXN demo.
- Simulador de proveedor con éxitos y errores controlados.
- Eventos append-only de auditoría.
- Comprobante con marca `SIMULACIÓN`.
- Vista administrativa de intents demo, con teléfonos enmascarados.

### Fuera de alcance

- Dinero real, SPEI, DiMo, CoDi, CLABE, Bitso o blockchain real.
- Modificar balances, wallets, ledger o `server/src/data/db.json`.
- Llamar a `/api/transactions/send` o `paymentEngineService.processPayment()`.
- WhatsApp Cloud API, Messenger o Instagram.
- KYC real, biometría, voz, emojis, división de cuentas o remesas internacionales.
- IA generativa como autorizador o ejecutor.

---

## 2. Contratos de dominio

### Crear payment intent

`POST /api/v1/payment-intents`

Headers:

```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid-del-canal>
Content-Type: application/json
```

Body:

```json
{
  "type": "domestic_p2p_mxn",
  "recipient": {
    "type": "beneficiary_id",
    "value": "demo-beneficiary-maria"
  },
  "amount": {
    "value": 250,
    "currency": "MXN"
  },
  "concept": "comida",
  "channel": "paychat_web"
}
```

Respuesta `201`:

```json
{
  "intent": {
    "id": "pi_demo_...",
    "status": "PENDING_CONFIRMATION",
    "type": "domestic_p2p_mxn",
    "senderId": "demo-admin",
    "recipient": {
      "id": "demo-beneficiary-maria",
      "displayName": "María López",
      "maskedPhone": "******4821"
    },
    "amount": { "value": 250, "currency": "MXN" },
    "fee": { "value": 0, "currency": "MXN" },
    "total": { "value": 250, "currency": "MXN" },
    "concept": "comida",
    "channel": "paychat_web",
    "simulation": true,
    "expiresAt": "<ISO-8601>"
  },
  "confirmationToken": "<token-opaco-de-un-solo-uso>"
}
```

### Confirmar

`POST /api/v1/payment-intents/:id/confirm`

Headers:

```http
Authorization: Bearer <jwt>
Idempotency-Key: <uuid-de-confirmacion>
```

Body:

```json
{
  "confirmationToken": "<token-opaco>"
}
```

Respuesta `200`: intent `SUCCEEDED` y comprobante demo.

### Cancelar

`POST /api/v1/payment-intents/:id/cancel`

Solo el propietario autenticado puede cancelar un intent en `PENDING_CONFIRMATION`.

### Consultar

- `GET /api/v1/payment-intents/:id`: propietario o admin.
- `GET /api/v1/admin/payment-intents`: admin; salida enmascarada.

### Estados

```text
CREATED → PENDING_CONFIRMATION → AUTHORIZED → PROCESSING → SUCCEEDED
               ├──────────────→ CANCELLED
               └──────────────→ EXPIRED
AUTHORIZED/PROCESSING ─────────→ FAILED | UNDER_REVIEW
```

Cada transición agrega un evento; nunca se edita ni elimina un evento anterior.

---

## 3. Tareas de implementación

### Tarea 1 — Documento rector del MVP

**Objetivo:** Convertir la conversación compartida y `docs/paychat/README.md` en criterios verificables.

**Archivos:**
- Crear: `docs/paychat/MVP.md`
- Modificar: `docs/paychat/README.md`

**Pasos:**
1. Documentar propuesta de valor, responsabilidades PayChat/Core, recorrido “Paga 250 pesos a María”, alcance y exclusiones.
2. Incluir correcciones: DiMo no es directorio público; CoDi no elimina autorización bancaria; PayChat no mueve dinero.
3. Enlazar la conversación fuente y este plan.
4. Revisar que no se prometa producción ni dinero real.

**Validación:** búsqueda de `SIMULACIÓN`, `no mueve dinero`, `confirmación explícita` e `idempotencia` en ambos documentos.

---

### Tarea 2 — Modelo y máquina de estados del Core

**Objetivo:** Definir estados y transiciones válidas sin persistencia financiera.

**Archivos:**
- Crear: `server/src/modules/paymentIntents/paymentIntent.constants.js`
- Crear: `server/src/modules/paymentIntents/paymentIntentStateMachine.js`
- Crear: `server/test/paymentIntentStateMachine.test.js`

**TDD:**
1. Probar transiciones válidas.
2. Probar rechazo de `SUCCEEDED → PROCESSING`, doble confirmación y cancelación posterior a autorización.
3. Ejecutar `cd server && node --test test/paymentIntentStateMachine.test.js`; debe fallar inicialmente.
4. Implementar lo mínimo.
5. Repetir hasta aprobar.

**Regla:** la máquina no conoce Express, JWT, DB ni proveedor.

---

### Tarea 3 — Repositorio demo append-only

**Objetivo:** Persistir intents y eventos únicamente en memoria durante la demostración.

**Archivos:**
- Crear: `server/src/modules/paymentIntents/inMemoryPaymentIntent.repository.js`
- Crear: `server/test/inMemoryPaymentIntent.repository.test.js`

**Comportamientos:**
- `create(intent, event)`.
- `findById(id)`.
- `findByIdempotencyKey(userId, key, operation)`.
- `transition(id, nextStatus, event)` añade evento sin mutar eventos anteriores.
- `listForAdmin()` devuelve copias, no referencias mutables.
- `reset()` disponible solo para pruebas.

**TDD:** probar duplicados, inmutabilidad observable, orden de eventos y aislamiento entre usuarios.

**Seguridad:** no escribir `server/src/data/db.json`; no guardar PIN, JWT ni confirmation token en texto claro.

---

### Tarea 4 — Directorio de beneficiarios demo

**Objetivo:** Resolver “María” de forma determinista y sin datos reales.

**Archivos:**
- Crear: `server/src/config/paychatDemo.config.js`
- Crear: `server/src/modules/beneficiaries/demoBeneficiary.service.js`
- Crear: `server/test/demoBeneficiary.service.test.js`

**Fixture permitido:**

```js
{
  id: 'demo-beneficiary-maria',
  aliases: ['maría', 'maria', 'mi mamá'],
  displayName: 'María López',
  phone: '+5210000004821'
}
```

**Comportamientos:** coincidencia normalizada, resultado ambiguo, no encontrado y salida con teléfono enmascarado.

**Regla:** habilitar solo con `PAYCHAT_DEMO_ENABLED=true` y nunca en `NODE_ENV=production`.

---

### Tarea 5 — Cotización P2P MXN demo

**Objetivo:** Producir un resumen estable sin consultar servicios financieros reales.

**Archivos:**
- Crear: `server/src/modules/paymentIntents/demoQuote.service.js`
- Crear: `server/test/demoQuote.service.test.js`

**Reglas:**
- Solo `domestic_p2p_mxn`.
- Moneda `MXN`.
- Monto mayor a cero y máximo demo configurable.
- Comisión P2P MXN igual a `0`.
- Expiración de cinco minutos.
- Valores monetarios tratados como centavos enteros internamente; nunca usar floats para el estado del intent.

---

### Tarea 6 — Conector financiero simulado

**Objetivo:** Ejecutar una operación ficticia con interfaz compatible con futuros proveedores.

**Archivos:**
- Crear: `server/src/modules/paymentProviders/paymentProvider.interface.md`
- Crear: `server/src/modules/paymentProviders/simulator.connector.js`
- Crear: `server/test/simulator.connector.test.js`

**Interfaz:**

```js
execute({ intentId, amountInMinorUnits, currency, recipientId, idempotencyKey })
getStatus(providerReference)
```

**Escenarios deterministas:** éxito, rechazo, timeout, revisión y repetición idempotente. No usar aleatoriedad en pruebas.

**Salida exitosa:** referencia `SIM-...`, estado `succeeded`, `simulation: true`.

---

### Tarea 7 — Servicio de payment intents

**Objetivo:** Orquestar creación, confirmación, cancelación y consulta.

**Archivos:**
- Crear: `server/src/modules/paymentIntents/paymentIntent.service.js`
- Crear: `server/test/paymentIntent.service.test.js`

**Pruebas obligatorias:**
- Crea intent pendiente con resumen y evento `intent.created`.
- Misma idempotency key y mismo payload devuelve el mismo intent.
- Misma key con payload distinto devuelve conflicto.
- Usuario diferente no puede consultar, confirmar ni cancelar.
- Token incorrecto, usado o vencido no confirma.
- Intent vencido cambia a `EXPIRED`.
- Confirmar dos veces no ejecuta dos veces el conector.
- Cancelar impide confirmar.
- Eventos esperados: `created`, `confirmation_requested`, `authorized`, `processing`, `succeeded`.
- Ningún camino llama al Payment Engine legado ni modifica wallets.

**Autorización:** derivar siempre `senderId` del JWT; ignorar cualquier `senderId` del body.

---

### Tarea 8 — API Core versionada

**Objetivo:** Exponer los contratos HTTP estables.

**Archivos:**
- Crear: `server/src/routes/v1/paymentIntents.routes.js`
- Crear: `server/src/routes/v1/adminPaymentIntents.routes.js`
- Modificar: `server/src/server.js`
- Crear: `server/test/paymentIntents.routes.test.js`

**Rutas:**
- Montar usuario en `/api/v1/payment-intents`.
- Montar admin en `/api/v1/admin/payment-intents`.
- Usar `authenticate` y `authorize('admin')` existentes.
- Validar `Idempotency-Key` y esquema del body antes del servicio.
- Responder `400`, `401`, `403`, `404`, `409`, `410` de forma determinista.

**Verificación HTTP:** sin JWT `401`; usuario normal no ve admin; demo admin sí puede operar en desarrollo.

---

### Tarea 9 — Gateway PayChat independiente

**Objetivo:** Crear un servicio conversacional sin estado financiero propio.

**Archivos:**
- Crear: `paychat/package.json`
- Crear: `paychat/src/server.js`
- Crear: `paychat/src/parser/commandParser.js`
- Crear: `paychat/src/services/coreClient.js`
- Crear: `paychat/src/services/conversation.service.js`
- Crear: `paychat/test/commandParser.test.js`
- Crear: `paychat/test/conversation.service.test.js`

**Parser inicial:**
- “Paga 250 pesos a María por comida”.
- “Enviar $250 MXN a María”.
- `/pagar 250 MXN maria comida`.
- `confirmar`, `cancelar`, `estado`, `ayuda`.

**Salida del parser:**

```json
{
  "intent": "send_payment",
  "slots": {
    "amountInMinorUnits": 25000,
    "currency": "MXN",
    "recipientAlias": "María",
    "concept": "comida"
  },
  "missingSlots": [],
  "confidence": "deterministic"
}
```

**Reglas:**
- No ejecutar ante ambigüedad.
- Pedir un dato faltante a la vez.
- No enviar PIN ni token en mensajes.
- `coreClient` consume solo `/api/v1`; no importa servicios internos de `server/`.
- PayChat conserva sesiones y mensajes, pero no balances, ledger ni estado financiero canónico.

---

### Tarea 10 — API conversacional web

**Objetivo:** Permitir que la UI envíe mensajes al Gateway.

**Archivos:**
- Crear: `paychat/src/routes/messages.routes.js`
- Crear: `paychat/test/messages.routes.test.js`

**Contrato:** `POST /api/paychat/v1/messages` con JWT reenviado al Core, `sessionId` y `text`.

**Respuesta:** lista de mensajes renderizables y, cuando aplique, acciones estructuradas `confirm`/`cancel` asociadas al intent.

**Seguridad:** CORS solo para frontend local configurado; rate limit; tamaño máximo del mensaje; logs enmascarados.

---

### Tarea 11 — Interfaz web `/paychat`

**Objetivo:** Construir el primer canal visible con aspecto de chat y acciones explícitas.

**Archivos:**
- Crear: `src/pages/PayChat/PayChat.jsx`
- Crear: `src/pages/PayChat/PayChat.css`
- Crear: `src/services/paychatApi.js`
- Modificar: `src/App.jsx`
- Modificar: `src/pages/Admin/AdminInterfaces.jsx`
- Modificar: `src/components/navigation/BottomNav.jsx`

**UI:**
- Encabezado “PayChat — Simulación”.
- Historial local de mensajes de la sesión.
- Sugerencia “Paga 250 pesos a María por comida”.
- Resumen en tarjeta antes de confirmar.
- Botones separados `Confirmar` y `Cancelar`.
- Estado de carga que evita doble clic.
- Comprobante con folio, importe, destinatario, estado y marca `NO ES DINERO REAL`.
- Mensajes de error claros para expiración, conflicto, ambigüedad y conexión.

**Restricción visual:** solicitar revisión del usuario antes del lint/build final, conforme al flujo de trabajo creativo.

---

### Tarea 12 — Vista administrativa demo

**Objetivo:** Observar intents y eventos sin exponer datos sensibles.

**Archivos:**
- Crear: `src/pages/Admin/PayChatIntents.jsx`
- Crear: `src/pages/Admin/PayChatIntents.css`
- Modificar: `src/App.jsx`
- Modificar: `src/pages/Admin/AdminInterfaces.jsx`

**Campos:** folio, estado, monto, canal, destinatario enmascarado, timestamps y timeline de eventos.

**No mostrar:** JWT, PIN, confirmation token, teléfono completo, payloads internos ni contenido completo del chat.

---

### Tarea 13 — Integración y pruebas de aceptación

**Objetivo:** Probar el recorrido real entre los tres procesos.

**Archivos:**
- Crear: `scripts/verify-paychat-demo.js`
- Modificar: `.env.example`
- Modificar: `README.md`

**Entorno local:**
- Frontend: `127.0.0.1:5173`.
- Core: `127.0.0.1:3000`.
- Gateway PayChat: `127.0.0.1:3001`.
- Variables demo únicamente en `.env.local`, ignoradas por Git.

**Aceptación automatizada:**
1. Login demo retorna `admin`.
2. Mensaje crea intent pendiente.
3. Resumen muestra María terminada en 4821, `$250 MXN`, comisión `$0`.
4. Confirmación produce `SUCCEEDED` y referencia `SIM-...`.
5. Repetir confirmación conserva la misma referencia.
6. Usuario distinto recibe `403`.
7. Intent vencido recibe `410`.
8. Admin ve timeline enmascarado.
9. Ningún balance ni registro de `db.json` cambia antes/después.

**Comandos finales:**

```bash
cd server && npm test
cd ../paychat && npm test
cd .. && node --test test/adminAccess.test.js
npm run build
cd server && node --check src/server.js
```

Además, arrancar los tres servicios, ejecutar `node scripts/verify-paychat-demo.js`, comprobar la UI en navegador y detener procesos al finalizar la verificación.

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación MVP |
|---|---|
| Doble envío por reintento o doble clic | Idempotency key en creación, confirmación y conector |
| IA interpreta destinatario equivocado | Parser determinista; resumen y confirmación; nunca ejecutar con ambigüedad |
| Robo de sesión de chat | JWT, intent ligado al propietario, token opaco de un solo uso y expiración |
| Filtrar PIN/token en mensajes o logs | Nunca aceptar PIN en chat; redacción automática; pruebas de ausencia |
| Duplicar ledger/balance en PayChat | Gateway consume `/api/v1`; no importa DB/Core ni guarda estado financiero |
| Confundir demo con producción | Flags deshabilitados en producción y etiquetas visibles `SIMULACIÓN` |
| Prometer DiMo/CoDi libremente | Documentar dependencia de institución participante y autorización bancaria |
| Acoplarse a un proveedor | Interfaz de conector estable; simulador primero |
| Datos reales en demo | Fixtures ficticios; teléfonos enmascarados; memoria volátil |

---

## 5. Criterio de terminación

El MVP estará listo para revisión cuando complete 100 ejecuciones simuladas —incluyendo duplicados, cancelaciones, expiraciones y errores— sin:

- modificar balances reales o demo existentes;
- duplicar una ejecución;
- permitir autorización por otro usuario;
- omitir eventos auditables;
- exponer credenciales o teléfonos completos;
- presentar la operación como dinero real.

Después de esta aprobación se evaluará WhatsApp Business Cloud API. La conexión con una IFPE, banco o agregador autorizado será una fase posterior y requerirá revisión jurídica, contractual, de seguridad y cumplimiento.