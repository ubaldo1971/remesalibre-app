# PASO 2 — AUTENTICACIÓN (Auth Flow)

## 1. Arquitectura del Flujo

El sistema de autenticación es **"Passwordless" (OTP vía SMS/WhatsApp)** para maximizar conversión y seguridad en móviles.

### Diagrama de Estados
`Home` -> `Auth Gate` -> `OTP Verify` -> `Account Check (Loading)` -> [Ruteo Inteligente]
   *   Si es **Nuevo Usuario**: -> `Basic Profile` -> `Onboarding Success` -> `Flow Originar`
   *   Si es **Usuario Existente**: -> `Flow Originar` (Retoma donde dejó)

---

## 2. Pantallas y Bloques de UI

### A. Pantalla: Auth Gate (Entrada)
*   **Hero**: Logo RemesaLibre (Imagen proporcionada) + "Ingresa o Registrate".
*   **Input Block**:
    *   **Country Code Picker**: Default +1 (USA) o +52 (MX) según geolocalización IP (fallback user selection).
    *   **Phone Input**: Formateo automático `(555) 123-4567`. Teclado numérico nativo.
*   **Action**: Botón Primario "Continuar". (Deshabilitado hasta validar longitud).
*   **Legal Micro-copy**: "Al continuar aceptas recibir un SMS..."

### B. Pantalla: OTP Verify (Seguridad)
*   **Header**: "Verifica tu teléfono".
*   **Instruction**: "Enviamos un código al +1 (555) ***-4567".
*   **Componente OTP**:
    *   6 Inputs individuales.
    *   Auto-focus en el primero.
    *   Auto-advance al escribir.
    *   Pegado mágico (Paste code).
*   **Timer**: "Reenviar código en 30s".
*   **Error State**: Feedback visual (vibración + texto rojo) si el código es incorrecto.

### C. Pantalla: Account Check (Invisible/Loading)
*   **UI**: Spinner de carga con la identidad de marca (Logo animado).
*   **Lógica**: Consulta API para determinar si el teléfono ya existe en base de datos.
*   **Resolución**: Redirecciona a `Profile` o al flujo original (`/send` o `/receive`).

### D. Pantalla: Basic Profile (Solo Nuevos)
*   **Header**: "Unos detalles más".
*   **Form Block**:
    *   *Input* Nombre (Auto-capitalize words).
    *   *Input* Apellido.
    *   *Input* Email (Opcional visualmente, pero recomendado para recibos).
*   **Action**: "Crear Cuenta".

---

## 3. Reglas de Negocio y Validación

### Validación y Formato
*   **Teléfono**: Librería `libphonenumber-js` para validar longitud y formato real por país.
*   **OTP**: Solo numérico. 6 dígitos.
*   **Sanitización**: Eliminar espacios, guiones y paréntesis antes de enviar al API.

### Manejo de Errores (Error Handling)
1.  **Network Error**: "Revisa tu conexión a internet". (Retry Button).
2.  **Invalid OTP**: "Código incorrecto. Intenta de nuevo". (Shake animation).
3.  **Rate Limit**: "Demasiados intentos. Espera 5 minutos". (Bloqueo temporal de UI).
4.  **Service Down**: "Estamos en mantenimiento".

### Rate Limiting (Seguridad)
*   **Enviar OTP**: Máx 3 intentos por minuto. Máx 10 por hora.
*   **Validar OTP**: Máx 5 intentos fallidos bloquean el número por 15 min.

---

## 4. Estrategia Multiplataforma (PWA / Native)

### Persistencia de Sesión
*   **Secure Storage**:
    *   *Web/PWA*: `httpOnly` Cookies + `localStorage` (para flags no sensibles).
    *   *Native (Futuro)*: Keychain / Keystore.
*   **Auto-Login**: Si el token es válido, `AppShell` salta Auth y va directo a Home.

### Teclados y Inputs
*   Uso estricto de `inputmode="numeric"` y `autocomplete="one-time-code"` para integración nativa con SMS de iOS/Android.

### Navegación
*   **Deep Linking**: El "Magic Link" en el SMS puede abrir la app directamente (Android App Links / iOS Universal Links).

---

## 5. Diseño de Componentes (Reutilizables)

*   `PhoneInputWithCountry`: Selector de bandera + Input formateado.
*   `OTPInput`: Componente de 6 cajas con lógica de foco.
*   `FullScreenLoader`: Overlay de bloqueo durante llamadas API.
*   `ToastNotification`: Para errores efímeros (Top center).

## 6. Navegación desde Home

*   **Caso Envío**: Usuario invitado en Home -> Click "Enviar" -> `Guard` detecta no-sesión -> Redirige a `/auth/login?redirectTo=/flow/send`.
*   **Al Completar Auth**: Lee `redirectTo` -> Navega a `/flow/send`.
