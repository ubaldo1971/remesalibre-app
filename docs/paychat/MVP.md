# PayChat MVP — Documento rector

## Estado

PayChat aún no está implementado. Este documento define el alcance del primer MVP demostrativo y los límites que deben respetar su arquitectura, experiencia de usuario y desarrollo.

El MVP será una **SIMULACIÓN**. No mueve dinero real, no ejecuta SPEI, DiMo o CoDi, no custodia fondos y no debe presentarse como un producto financiero listo para producción.

## Contexto de producto

Este documento consolida:

- La arquitectura canónica descrita en [`README.md`](./README.md).
- La investigación y visión desarrolladas en la [conversación compartida sobre sistemas de pagos digitales y PayChat](https://chatgpt.com/share/6a5ebea0-2688-83e8-a197-7de4903dae38).
- Las reglas generales de seguridad y consolidación de RemesaLibre en [`../../AGENTS.md`](../../AGENTS.md).

La conversación compartida es contexto de producto e investigación. No demuestra que integraciones bancarias, regulatorias o técnicas mencionadas allí ya estén disponibles.

## Propuesta de valor

PayChat será una capa conversacional, social e inclusiva para solicitar operaciones al Core RemesaLibre mediante lenguaje cotidiano.

No pretende reemplazar infraestructuras como SPEI, DiMo, CoDi, Pix, UPI o PromptPay. Su diferenciación será facilitar el acceso a servicios financieros futuros sin obligar al usuario a entender CLABEs, redes de pago o procesos técnicos.

> PayChat interpreta y guía; RemesaLibre valida, autoriza y registra; un simulador o proveedor autorizado ejecuta.

## Experiencia objetivo

El primer recorrido completo será:

```text
Usuario:
Paga 250 pesos a María por comida.

PayChat:
Encontré a María López, teléfono terminado en 4821.

Monto: $250 MXN
Concepto: comida
Comisión: $0

¿Confirmas esta operación?

[Confirmar] [Cancelar]
```

Tras una confirmación válida:

```text
PayChat:
Operación simulada correctamente.

Monto: $250 MXN
Destinataria: María López
Folio: PYC-20260719-00001
Estado: completada

SIMULACIÓN — NO ES DINERO REAL
```

La operación nunca debe ejecutarse únicamente porque un modelo de IA interpretó el mensaje. Antes de cualquier ejecución se mostrará el beneficiario resuelto, monto, moneda, concepto, comisión, total y vencimiento para obtener una **confirmación explícita**.

## Acciones iniciales

La primera versión de producto contempla cinco acciones:

1. Registrar un usuario de prueba.
2. Agregar o seleccionar un beneficiario demo.
3. Enviar dinero simulado.
4. Solicitar dinero simulado.
5. Consultar el estado de una operación.

El primer incremento técnico implementará por completo solamente el envío P2P en MXN. Las demás acciones podrán aparecer como capacidades planificadas, pero no deben simular éxito si todavía no existen.

### Lenguaje natural objetivo

```text
Paga 250 pesos a María por comida
Cobra 300 pesos a Omar por la cena
Envía 100 dólares a mi mamá en Hermosillo
¿Cuál es el estado de mi último pago?
```

### Comandos deterministas de respaldo

```text
/pagar
/cobrar
/estado
/confirmar
/cancelar
/ayuda
```

El usuario no deberá memorizar comandos para utilizar la experiencia final. En el MVP, los comandos explícitos servirán como respaldo verificable mientras se valida el lenguaje natural.

## Arquitectura obligatoria

```text
Canal web PayChat
        │
        ▼
Gateway conversacional PayChat
        │ consume contratos HTTP versionados
        ▼
Core RemesaLibre
        │
        ▼
Conector financiero simulado
```

### Responsabilidades de PayChat

- Recibir mensajes desde canales conversacionales.
- Gestionar sesiones y mensajes.
- Interpretar intenciones y extraer datos.
- Detectar información faltante o ambigua.
- Solicitar aclaraciones sin ejecutar operaciones.
- Consultar beneficiarios mediante contratos del Core.
- Presentar cotizaciones y resúmenes.
- Solicitar confirmación explícita.
- Consultar y presentar estados y comprobantes.

### Responsabilidades de RemesaLibre Core

- Identidad financiera y autorización determinista.
- Beneficiarios canónicos.
- Cotizaciones, comisiones y vencimientos.
- Límites y reglas de riesgo.
- Payment intents e **idempotencia**.
- Estados oficiales de las operaciones.
- Balances, wallets y ledger cuando corresponda.
- Auditoría append-only.
- Enrutamiento hacia simuladores o proveedores.
- Conciliación y comprobantes oficiales futuros.

### Prohibiciones arquitectónicas

PayChat no debe:

- Mantener balances, wallets o ledger propios.
- Autorizar operaciones por decisión de una IA.
- Importar directamente servicios internos o la base de datos de RemesaLibre.
- Escribir en `server/src/data/db.json` durante el MVP.
- Llamar al endpoint legado `/api/transactions/send`.
- Invocar directamente `paymentEngineService.processPayment()`.
- Guardar PIN, JWT o tokens de confirmación dentro de mensajes o logs.

PayChat consumirá contratos versionados del Core, comenzando por `/api/v1/payment-intents`.

## Flujo del payment intent

```text
Mensaje del usuario
      ↓
Interpretación determinista
      ↓
Resolución de beneficiario
      ↓
Creación del payment intent
      ↓
Resumen y confirmación explícita
      ↓
Autorización determinista del Core
      ↓
Conector financiero simulado
      ↓
Comprobante y auditoría
```

### Estados mínimos

```text
CREATED
PENDING_CONFIRMATION
AUTHORIZED
PROCESSING
SUCCEEDED
CANCELLED
REJECTED
EXPIRED
FAILED
REVERSED
UNDER_REVIEW
```

Una operación nunca se borra ni sobrescribe silenciosamente. Cada cambio de estado crea un evento auditable con actor, fecha, acción y resultado.

## Idempotencia

La idempotencia es obligatoria desde el primer MVP, aunque no exista dinero real.

- Crear una intención requiere una clave de idempotencia.
- Confirmar una intención requiere otra clave de idempotencia.
- Repetir la misma petición debe devolver el resultado original.
- Reutilizar una clave con un payload diferente debe producir un conflicto.
- Una confirmación repetida nunca debe ejecutar dos veces el conector.
- Los reintentos por timeout no deben generar una segunda operación.

## Autorización y seguridad

- El usuario ordenante se obtiene exclusivamente del JWT autenticado.
- El body no puede elegir ni sustituir al usuario ordenante.
- Solo el propietario puede consultar, confirmar o cancelar su intención; un administrador solo podrá observar datos enmascarados.
- La confirmación utilizará un token opaco, de un solo uso y con expiración.
- El PIN no se solicitará ni enviará dentro del chat.
- Una intención ambigua, vencida, cancelada o ya concluida no puede ejecutarse.
- Los teléfonos se mostrarán enmascarados.
- Los fixtures demo serán ficticios y estarán deshabilitados en producción.
- La UI, API, comprobantes y panel administrativo mostrarán claramente `SIMULACIÓN` y `NO ES DINERO REAL`.

## Simulador financiero

El primer proveedor será un conector ficticio con una interfaz equivalente a la de futuros proveedores autorizados.

Debe poder reproducir de forma determinista:

- Operación exitosa.
- Fondos insuficientes.
- Beneficiario inexistente.
- Operación duplicada.
- Timeout.
- Rechazo por límites.
- Cuenta bloqueada.
- Revisión antifraude.
- Caída del proveedor.
- Reintento sin doble ejecución.

El simulador no modificará balances existentes. Su resultado será una referencia con prefijo `SIM-` y un comprobante inequívocamente demostrativo.

## Correcciones y precisiones regulatorias

La visión original incluye ideas que solo podrán ofrecerse mediante instituciones y proveedores con capacidad legal y técnica verificable:

- **DiMo:** no debe modelarse como un directorio bancario público que entregue libremente la CLABE asociada a cualquier teléfono. PayChat necesitará una institución participante o socio autorizado.
- **CoDi:** una experiencia conversacional puede preparar y enviar una solicitud de cobro, pero no elimina la revisión y autorización requerida por la institución del pagador.
- **SPEI:** PayChat no se conectará por sí solo como participante; la ejecución futura requerirá banco, IFPE, agregador o proveedor autorizado.
- **Wallet:** el MVP no custodiará fondos ni emitirá fondos de pago electrónico.
- **Remesas y activos virtuales:** USDC, `$PESO`, Bitso y RemesaSwap permanecen fuera del MVP y no deben describirse como infraestructura real desplegada.
- **IA antifraude o biometría:** son posibilidades futuras, no controles existentes ni sustitutos de reglas deterministas.

La ruta recomendada para una fase real es PayChat como proveedor tecnológico conectado a una institución autorizada, no como IFPE propia desde el inicio.

## Alcance del MVP

### Incluido

- Chat web protegido en `/paychat`.
- Usuario e identidad demo.
- Beneficiario ficticio “María López”.
- Pago P2P simulado en MXN.
- Comisión de `$0` para el caso demo.
- Payment intent versionado.
- Resumen, confirmación, cancelación y expiración.
- Idempotencia y auditoría append-only.
- Comprobante demo.
- Vista administrativa con datos enmascarados.

### Fuera de alcance

- Dinero real.
- WhatsApp, Messenger o Instagram reales.
- SPEI, DiMo, CoDi, CLABE, tarjetas o efectivo.
- Remesas EUA–México.
- Criptomonedas o tokens.
- División de cuentas.
- Pagos por voz o emojis.
- Crédito, cashback y marketplace.
- KYC o biometría reales.
- Wallet propia.

Estas capacidades pueden formar parte de la visión futura, pero no deben bloquear ni contaminar la primera operación demostrativa.

## Criterios de aceptación

El MVP se considerará funcional cuando:

1. Un usuario demo autenticado pueda escribir “Paga 250 pesos a María por comida”.
2. PayChat extraiga monto, moneda, beneficiario y concepto sin ejecutar nada.
3. RemesaLibre cree un payment intent en `PENDING_CONFIRMATION`.
4. La interfaz muestre nombre, teléfono enmascarado, monto, comisión `$0`, total y vencimiento.
5. Confirmar produzca una única ejecución simulada y un folio `SIM-...`.
6. Cancelar o dejar vencer la intención impida su ejecución.
7. Repetir creación o confirmación no duplique la operación.
8. Otro usuario no pueda confirmar ni consultar la intención.
9. El panel administrativo muestre la línea de eventos sin datos sensibles.
10. Ningún balance, wallet, ledger o dato de `db.json` cambie.
11. Todo resultado visible indique que es una simulación.
12. Las pruebas cubran éxito, duplicado, cancelación, expiración, ambigüedad y error del proveedor.

Antes de evaluar WhatsApp, el sistema deberá completar 100 ejecuciones simuladas controladas —incluyendo errores y reintentos— sin duplicados, autorizaciones indebidas ni exposición de credenciales.

## Evolución posterior

Solo después de validar el MVP web:

1. Conectar WhatsApp Business Cloud API como adaptador del Gateway PayChat.
2. Validar identidad y consentimiento con un modelo jurídico definido.
3. Evaluar una sola institución financiera autorizada.
4. Sustituir un escenario del simulador por una integración sandbox.
5. Ejecutar un piloto limitado, supervisado y con límites bajos.
6. Incorporar solicitudes de cobro, comercios y remesas en fases separadas.

Ninguna fase posterior autoriza por sí misma el manejo de dinero real. Cada integración requerirá revisión legal, contractual, de seguridad, cumplimiento, auditoría y pruebas específicas.
