# PASO 1 — HOME (Pantalla de bienvenida)

## 1. Estructura Jerárquica (Layout Base)

La estructura sigue un patrón **"Vertical Stack"** fluido, optimizado para gestos de scroll y tacto.

*   **`AppShell`** (Contenedor Principal - Mobile Viewport Fixed)
    *   **`TopBar`** (Header fijo o retráctil al scroll)
    *   **`MainContent`** (Scrollable Area)
        *   `HeroSection` (Identidad y Mensaje)
        *   `ActionBoard` (Panel de Acciones Principales - *Sticky en viewport altos*)
        *   `TrustSignalBlock` (Elementos de confianza)
        *   `LegalFooter` (Términos y condiciones)
    *   **`BottomNav`** (Opcional - Reemplazado por acciones directas en MVP, reservado para expansión futura)

---

## 2. Componentes Reutilizables

Diseñados para ser agnósticos de la plataforma (Web/Native).

### A. Core UI
*   **`LogoHeader`**: Componente SVG optimizado. Muestra solo isotipo en scroll down, logotipo completo en top.
*   **`PrimaryButton` (Large)**: Botón de alta altura (56px+), ancho completo o 90%. Feedback háptico (vibración) visual.
    *   *Uso:* Acción "Enviar Dinero".
*   **`SecondaryButton` (Outline/Ghost)**: Botón con borde, misma altura.
    *   *Uso:* Acción "Recibir Dinero".
*   **`InfoCard`**: Contenedor con sombra suave (elevation-1), bordes redondeados (16px+).
    *   *Uso:* Mostrar tipo de cambio o estado de seguridad.

### B. Bloques Funcionales
*   **`ExchangeRateTicker`**: Widget vivo. Muestra "1 USD = [XX.XX] MXN".
    *   *Comportamiento:* Actualización silenciosa cada 60s. Indicador visual de "En vivo".
*   **`TrustBadgeRow`**: Fila horizontal de iconos con etiquetas (ej. Escudo Seguridad, Rayo Velocidad).

---

## 3. Estados de la Pantalla

### Estado A: Visitante (No Logueado)
*   **Header**: Logo RemesaLibre + Botón "Ayuda".
*   **Hero**: Mensaje de valor claro. *"Tu dinero en México, en minutos."*
*   **Ticker**: Tasa de cambio actual visible y destacada (Gancho de conversión).
*   **Action Board**:
    *   Botón Primario: **"Enviar a México"** (Call to Action fuerte).
    *   Botón Secundario: **"Recibir dinero"**.
*   **Trust Block**: "Sin comisiones ocultas", "Seguridad Bancaria".

### Estado B: Usuario Autenticado (Logueado)
*   **Header**: Saludo *"Hola, [Nombre]"* + Avatar/Menu Perfil.
*   **Hero**: Resumen de actividad reciente (ej. "Tu último envío fue exitoso") o tasa de cambio del día.
*   **Action Board**:
    *   Botón Primario: **"Enviar Nuevo"** (Destacado).
    *   Botón Secundario: **"Solicitar/Recibir"**.
    *   *Historial Rápido (Opcional MVP)*: Acceso directo a "Repetir envío a Mamá".

---

## 4. Lógica de Navegación

El ruteo maneja la lógica de estado sin cambiar la URL base visualmente en la PWA (modal-like feel).

1.  **Click en "Enviar dinero"**:
    *   *Check Sesión*:
        *   **NO**: Redirige a `/auth/login?intent=send`.
        *   **SI**: Navega a `/flow/send/amount`.
2.  **Click en "Recibir dinero"**:
    *   *Check Sesión*:
        *   **NO**: Muestra Modal Informativo o `/auth/login?intent=receive`.
        *   **SI**: Navega a `/flow/receive/share-link`.
3.  **Click en "Ayuda"**:
    *   Abre `/support` (Overlay o nueva pantalla según dispositivo).

---

## 5. Compatibilidad PWA y Nativa

*   **Responsive**: Layouts definidos con *Flexbox/Grid* y unidades relativas (`rem`, `vh`).
*   **Touch Targets**: Todos los elementos interactivos tienen mínimo 48x48px (Apple Human Interface Guidelines).
*   **Safe Areas**: Padding superior e inferior contempla "Notch" y "Home Indicator" (iOS).
*   **Offline Support (Service Worker)**:
    *   La Home carga "Shell" inmediatamente.
    *   Si no hay red, muestra última tasa conocida con advertencia "Offline".
