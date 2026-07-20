# PASO 4 — RECEIVE / BALANCE FLOW (Receptor)

## 1. Principios UX

*   **Propiedad Inmediata**: "El dinero es mío". El saldo es el protagonista absoluto.
*   **Cero Fricción**: Retirar o Pagar debe ser tan simple como en un banco digital moderno.
*   **Abstracción Total**: Fiat-first (MXN/USD). Cero hashes, cero "blockchain confirmation".

---

## 2. Mapa de Navegación

`BalanceHome`
 ├─ `MovementHistory` (Ver todo)
 ├─ `WithdrawFlow` (Retirar)
 │    ├─ MethodSelector
 │    ├─ AmountInput
 │    └─ Confirmation
 └─ `PayFlow` (Pagar)
      ├─ Method/Scan
      └─ Confirmation

---

## 3. Pantallas y Estados

### 4.1 BALANCE HOME (Centro de Control)
*   **Header**: Perfil (Avatar pequeño) + Notificaciones.
*   **Hero (Balance Card)**:
    *   **Saldo Total**: Tipografía Gigante (ej. `$5,200.00 MXN`).
    *   **Bandera/Moneda**: Indicador claro de la divisa.
    *   **Estado**: "Disponible" (verde) o "Pendiente" (ámbar sutil).
*   **Action Grid (Botones Grandes)**:
    1.  **Retirar**: Icono "Flecha Abajo" o "Banco".
    2.  **Pagar**: Icono "QR" o "Tarjeta".
    3.  *(Futuro)* **Transferir**: Deshabilitado o secundario.
*   **Quick Info / Recent**:
    *   "Último movimiento": Resumen de 1 línea del ingreso más reciente.
    *   Link "Ver movimientos".

### 4.2 MOVEMENT HISTORY (Transparencia)
*   **Header**: "Volver". Título: "Tu Dinero".
*   **Lista de Movimientos**:
    *   **Agrupación**: "Hoy", "Ayer", "Este Mes".
    *   **Item**:
        *   Icono (Arrow Down/Up, Shop).
        *   Título: "Recibido de Alex" / "Retiro BBVA" / "Pago Oxxo".
        *   Monto: `+$500` (Verde) / `-$200` (Negro).
        *   *Detalle (tap)*: Fecha exacta, Nota.
*   **Estados**:
    *   *Loading*: Skeleton.
    *   *Empty*: "Aún no tienes movimientos".
    *   *Loaded*: Lista cronológica.

### 4.3 WITHDRAW (Retirar)
*   **Función**: Sacar el dinero a mundo físico/bancario.
*   **Step A: Method Selector**:
    *   *Cuenta Bancaria (SPEI)*: "Llega en minutos".
    *   *Retiro sin Tarjeta*: "Cajero Automático".
*   **Step B: Amount**:
    *   Input "Cuánto quieres retirar".
    *   "Saldo disponible: $X". Botón "Max".
*   **Step C: Confirmation**: Resumen claro.
*   **CTA**: "Confirmar Retiro".

### 4.4 PAY (Pagar)
*   **Función**: Uso diario del saldo.
*   **UI**:
    *   **Escáner QR** (Viewfinder de cámara) para comercios.
    *   **Código de Barras** para mostrar en caja.
*   **Confirmación**:
    *   Monto a pagar + Comercio destino.
    *   CTA: "Pagar ahora".

---

## 4. Componentes Reutilizables

*   **`BalanceDisplay`**: Componente responsivo para mostrar montos grandes con decimales pequeños.
*   **`ActionGrid`**: Grid de 2 o 3 columnas para botones principales.
*   **`TransactionRow`**: Fila de lista con icono izq, texto principal/secundario centro, monto der.
*   **`MethodSelector`**: Lista seleccionable con radio buttons.
*   **`CameraView`**: Contenedor para escáner QR.

---

## 5. Consideraciones Técnicas PWA/Native

*   **Acceso a Cámara**: Usar API nativa o HTML5 `getUserMedia` para el QR.
*   **Notificaciones**: Local Notifications al recibir dinero.
*   **Offline Mode**: Mostrar último saldo conocido con indicador "Sin conexión".
