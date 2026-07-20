# PASO 3 — SEND MONEY FLOW (Envío de Dinero)

## 1. Principios UX

*   **Claridad Total**: El usuario ve exactamente lo que envía (USD) y recibe (MXN).
*   **Linealidad**: Una decisión por pantalla para evitar carga cognitiva.
*   **Confianza**: Resumen final claro ("Review") antes de cualquier compromiso.
*   **Reversibilidad**: Botón "Volver" siempre disponible hasta la confirmación.

---

## 2. Diagrama de Flujo (User Journey)

`Home` -> `AmountInput` -> `RecipientSelection` -> `PaymentMethod` -> `Review` -> `Processing` -> `Confirmation`

---

## 3. Pantallas y Estados

### 3.1 AMOUNT INPUT (Definir Monto)
*   **Header**: Botón "Volver" (X o Arrow). Título: "Enviar a México".
*   **Core UI**:
    *   **Input Grande**: Monto en USD. Auto-focus. Teclado numérico.
    *   **Live Conversion**: Muestra equivalente en MXN inmediatamente debajo.
        *   *Visual*: `1 USD = $XX.XX MXN` (pill discreto).
    *   **Delivery Estimate**: "Llega en minutos".
*   **CTA**: "Continuar". (Activo solo si monto > min y < max).
*   **Estados**:
    *   *Idle*: Input vacío o default.
    *   *Calculating*: Spinner sutil en el monto MXN mientras cotiza.
    *   *Error*: "Monto máximo $2,999 USD".

### 3.2 RECIPIENT SELECTION (Destinatario)
*   **Header**: "Volver". Título: "¿A quién envías?".
*   **List**:
    *   *Recent*: Avatares de envíos previos (Scroll horizontal).
    *   *Add New*: Opción destacada "+ Nuevo destinatario".
*   **New Recipient Form** (Si se selecciona "Nuevo"):
    *   Input: Nombre Legal.
    *   Input: Teléfono Móvil (Validación formato).
    *   Selector: Método de Entrega (Bancario, Efectivo, Wallet).
*   **CTA**: "Continuar".
*   **Estados**: *Selecting*, *Adding*, *Validating*.

### 3.3 PAYMENT METHOD (Origen de Fondos)
*   **Header**: "Volver". Título: "¿Cómo quieres pagar?".
*   **List**:
    *   *Tarjeta Débito/Crédito*: Iconos Visa/Mastercard.
    *   *Apple/Google Pay*: Opciones rápidas nativas.
    *   *Bank Account (ACH)*: Opción más lenta pero económica.
*   **Selection Logic**: Radio button simple o cards seleccionables.
*   **CTA**: "Continuar".

### 3.4 REVIEW (La Pantalla de la Verdad)
*   **Header**: "Volver". Título: "Revisa tu envío".
*   **Summary Card**:
    *   **Monto Envío**: $100.00 USD
    *   **Comisión**: $0.00 USD (Highlight "Gratis").
    *   **Total a Pagar**: $100.00 USD
    *   **Tipo de Cambio**: 1 USD = $19.50 MXN
    *   **Recibe**: $1,950.00 MXN
*   **Details**:
    *   *Para*: [Nombre Destinatario]
    *   *Entrega*: [Método] (ej. BBVA ****1234)
    *   *Tiempo*: Instantáneo.
*   **CTA Principal**: Botón Grande **"Enviar dinero ahora"**.
*   **Legal**: "Al enviar aceptas..."

### 3.5 PROCESSING (Transición)
*   **UI**: Pantalla limpia. Animación central (Lottie/CSS) de "Billetes volando" o "Procesando seguro".
*   **Textos Rotativos**: "Verificando fondos...", "Conectando con México...", "Finalizando...".
*   **Regla**: No botones de acción. Prevenir "Back".

### 3.6 CONFIRMATION (Éxito)
*   **UI**: Icono Éxito Grande (Check Verde animado).
*   **Feedback**: "¡Listo! Tu dinero va en camino."
*   **Resumen Clave**: "Enviaste $100 USD a [Nombre]".
*   **Actions**:
    *   Primaria: "Ver comprobante" (Detalle transacción).
    *   Secundaria: "Volver al Inicio" o "Enviar otro".

---

## 4. Componentes Reutilizables (Design System)

*   **`MoneyInput`**: Input con prefijo de moneda ($) y formateo de miles automático.
*   **`SummaryRow`**: Fila `Label ........ Value`.
*   **`MethodCard`**: Tarjeta con icono, título y radio de selección.
*   **`RecipientAvatar`**: Círculo con iniciales o foto.

---

## 5. Compatibilidad Técnica

*   **Routing**: `/flow/send/amount`, `/flow/send/recipient`, `/flow/send/payment`, `/flow/send/review`, `/flow/send/success`.
*   **State Persistence**: Usar `Context` o `sessionStorage` para guardar los datos del wizard si el usuario recarga.
*   **Native Feel**: Transiciones tipo "Slide Left" al avanzar y "Slide Right" al volver.
