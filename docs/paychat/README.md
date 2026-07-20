# PayChat — estado y relación con RemesaLibre

## Estado actual

PayChat todavía no tiene carpeta de aplicación, repositorio ni código implementado. Este directorio conserva únicamente contexto de producto y arquitectura.

## Responsabilidades

### PayChat

- Canales conversacionales.
- Sesiones y mensajes.
- Interpretación de intenciones.
- Resolución conversacional de ambigüedades.
- Presentación de cotizaciones.
- Solicitud de confirmaciones explícitas.
- Notificaciones y comprobantes obtenidos desde RemesaLibre.

### RemesaLibre

- Identidad financiera y beneficiarios.
- Cotizaciones, tipos de cambio y comisiones.
- Límites y riesgo.
- Autorizaciones.
- Payment intents e idempotencia.
- Ledger y estado oficial de transacciones.
- Enrutamiento de proveedores y conciliación.
- Auditoría financiera.

## Regla de seguridad

La IA puede interpretar lenguaje, pero no autoriza ni mueve dinero. PayChat solicita; RemesaLibre valida y registra; un proveedor autorizado ejecuta cuando corresponda.

## Dependencia para comenzar

Antes de crear PayChat deben estabilizarse y versionarse en RemesaLibre los contratos mínimos para:

1. Identidad.
2. Beneficiarios.
3. Cotizaciones.
4. Payment intents.
5. Confirmaciones/autorizaciones.
6. Estado de transacciones.
7. Comprobantes y eventos.

La imagen `mapa-mental-paychat.png` representa una visión objetivo, no código existente ni alcance comprometido del MVP.
