# PASO 5 — IDENTITY VERIFICATION FLOW (Trust & Protection)

## 1. Principios UX

*   **Protección, no Control**: La verificación es para *proteger su dinero*, no para vigilarlo.
*   **Invisible hasta ser necesario**: Solo se pide cuando el usuario quiere "más" (más monto, retiros, etc.).
*   **Cero Tecnicismos**: Prohibido usar "KYC", "AML", "Compliance". Usar "Verificar identidad", "Proteger cuenta".
*   **Feedback Constante**: Nunca dejar al usuario esperando sin saber qué pasa.

---

## 2. Mapa de Navegación

`Context Trigger` (User hits limit/feature)
  │
 ├─ `TrustPrompt` (Why we need this?)
 │    ├─ "Continuar" → `DocumentCapture`
 │    └─ "Más tarde" → Back to limited flow
 │
 ├─ `IdentityFlow`
      ├─ `DocumentCapture` (Front/Back ID)
      ├─ `SelfieCheck` (Liveness)
      ├─ `ReviewSubmission` (Summary)
      ├─ `Processing` (Async waiting)
      └─ `Result` (Success/Retry)

---

## 3. Pantallas y Estados

### 5.1 TRUST PROMPT (El Gate)
*   **Función**: Explicar el "Por qué" antes del "Qué".
*   **UI**:
    *   Icono amigable (Escudo, Candado abierto).
    *   Título: "Habilita envíos mayores a $10,000".
    *   Body: "Para tu seguridad y cumplir con regulaciones, necesitamos confirmar que eres tú. Toma 2 minutos."
*   **Acciones**:
    *   Primaria: "Verificar ahora".
    *   Secundaria: "Ahora no" (Mantiene límites actuales).

### 5.2 DOCUMENT CAPTURE (Tu Identificación)
*   **Header**: "Paso 1 de 2: Tu Identificación".
*   **Selector**: INE / Pasaporte / Licencia (Iconos visuales).
*   **Cámara**:
    *   Overlay visual (marco rectangular) para guiar el encuadre.
    *   Detección automática (simulada o nativa).
*   **Preview**:
    *   "¿Es legible?" (Sí, continuar / No, retomar).

### 5.3 SELFIE CHECK (Tu Rostro)
*   **Header**: "Paso 2 de 2: Una selfie rápida".
*   **UI**:
    *   Marco circular/ovalado.
    *   Instrucción: "Ubica tu rostro en el círculo".
*   **Feedback**:
    *   "Acércate un poco..."
    *   "Perfecto".

### 5.4 REVIEW & PROCESSING (Enviando)
*   **Review**: Muestra miniaturas de ID y Selfie. Botón "Enviar seguridad".
*   **Processing**:
    *   Animación pulse/ondas.
    *   Copy: "Validando tu información de forma segura..."
    *   *Nota*: No bloquear la app. Permitir "Avísame cuando esté listo".

### 5.5 RESULT & LIMITS MANAGER (El Beneficio)
*   **Result (Success)**:
    *   Confeti sutil.
    *   "¡Estás verificado!"
    *   Muestra los *nuevos* límites desbloqueados.
*   **Result (Retry)**:
    *   "No pudimos leer tu ID. ¿Intentamos de nuevo?" (Sin culpar al usuario).
*   **Limits Manager (Perfil)**:
    *   Barra de progreso o Niveles (Nivel 1: Básico, Nivel 2: Verificado).
    *   Lista de beneficios activos (checks verdes).

---

## 4. Componentes Reutilizables

*   **`ContextGateModal`**: Bottom sheet o modal para el Trust Prompt.
*   **`CameraCapture`**: Componente wrapper de `getUserMedia` con overlays svg.
*   **`ProcessingScreen`**: Estado de carga elegante con mensajes rotativos ("Encriptando...", "Verificando...").
*   **`LimitsCard`**: Tarjeta visual que muestra montos máximos y features.

---

## 5. Consideraciones Técnicas

*   **Imágenes**: Compresión en cliente antes de subir (max 1MB).
*   **Privacidad**: Las imágenes *nunca* se guardan en el carrete del dispositivo.
*   **Native Wrapper**: Usar plugins nativos de cámara si están disponibles para mejor enfoque/calidad.
