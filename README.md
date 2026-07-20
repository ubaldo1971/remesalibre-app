# RemesaLibre - Sistema de Pagos Instantáneos

![RemesaLibre](https://img.shields.io/badge/Status-Demo-orange) ![Version](https://img.shields.io/badge/Version-0.1.0-blue)

**Prototipo consolidado de una aplicación de pagos y remesas inspirada en Pix, UPI y WeChat Pay. No procesa dinero real ni está listo para producción.**

Esta rama reúne las tres copias locales del proyecto. Consulta [`docs/consolidation/README.md`](docs/consolidation/README.md) para conocer la procedencia del código, exclusiones de seguridad y archivos recuperados.

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ ([Descargar](https://nodejs.org/))
- npm 9+
- PostgreSQL 14+ (opcional, usa mock por defecto)

### Instalación y Ejecución

**Frontend:**
```bash
# Desde la raíz del proyecto
npm install
npm run dev
```
La aplicación estará disponible en: http://localhost:5173

**Backend:**
```bash
cd server
npm install

# Copiar archivo de entorno
copy .env.example .env

# Iniciar servidor
npm run dev
```
El API estará disponible en: http://localhost:3000

---

## ✨ Características Principales

### Para Usuarios
- ⚡ **Transferencias Instantáneas** - Envía dinero en menos de 5 segundos
- 📱 **Lookup por Teléfono** - Sistema DICT tipo Pix para encontrar destinatarios
- 📱 **Recepción QR** - Códigos QR dinámicos tipo Pix (Coming Soon)
- 💰 **Cash-out Flexible** - SPEI, OXXO, o cajeros corresponsales (Coming Soon)
- 🔒 **Controles simulados** - PIN y flujos de seguridad que requieren endurecimiento antes de producción
- 🌐 **Zero Blockchain Visible** - Sin wallets, direcciones o complejidad crypto
- 📊 **Historial Completo** - Seguimiento de todas tus transacciones
- 🎨 **Modo Oscuro** - Interfaz adaptable light/dark

### Flujo USDC → $PESO → MXN
```
Usuario envía USD
    ↓
Conversión automática: USDC → $PESO (token interno)
    ↓
Conversión: $PESO → MXN (con tipo de cambio real)
    ↓
Dinero disponible en MXN para el receptor
```

**El usuario final NUNCA ve blockchain, wallets, ni addresses.**

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│              Usuario Final (Mobile/Web)              │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   React Frontend       │
         │   (Vite + React 19)    │
         └───────────┬────────────┘
                     │
         ┌───────────▼───────────┐
         │   Express Backend      │
         │   Modular Architecture │
         │   ┌─────────────────┐  │
         │   │ UserDirectory   │  │ ← DICT (Phone Lookup)
         │   │ PaymentEngine   │  │ ← SPI (Payment Processor)
         │   │ Ledger          │  │ ← Double-entry Accounting
         │   │ QR Payments     │  │ ← Dynamic QR (Coming Soon)
         │   │ Cash-out        │  │ ← SPEI/OXXO (Coming Soon)
         │   │ Admin           │  │ ← Metrics & Config
         │   │ Auth & Security │  │ ← OTP, PIN, Limits
         │   └─────────────────┘  │
         └───────────┬────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐     ┌──────▼──────┐  ┌─────▼────┐
│In-Memory│   │ Blockchain  │  │ External │
│Database │   │ (Simulated) │  │ Services │
│ (Mock) │   │             │  │(Oracles) │
└────────┘   └─────────────┘  └──────────┘
             ↓              ↓
          USDC.sol      PESO.sol
         (Polygon)    RemesaSwap.sol
```

---

## 📂 Estructura del Proyecto

```
remesalibre-app/
│
├── src/                          # Frontend (React)
│   ├── components/               # Componentes reutilizables
│   ├── layouts/                 # Layouts principales
│   ├── pages/                   # Páginas de la aplicación
│   ├── store/                   # Estado global (Zustand)
│   ├── utils/                   # Utilidades
│   ├── App.jsx                  # Componente principal
│   └── main.jsx                 # Entry point
│
├── server/                       # Backend (Node.js)
│   └── src/
│       ├── modules/              # NEW: Modular architecture
│       │   ├── userDirectory/    # DICT - Phone lookup
│       │   ├── paymentEngine/    # SPI - Payment processor
│       │   ├── ledger/           # Accounting (TODO)
│       │   ├── qr/               # QR payments (TODO)
│       │   ├── cashout/          # Withdrawals (TODO)
│       │   ├── admin/            # Admin panel (TODO)
│       │   └── auth/             # Security (TODO)
│       ├── blockchain/           # Smart contract placeholders
│       │   ├── usdc.contract.js
│       │   ├── peso.contract.js
│       │   └── remesaSwap.contract.js
│       ├── routes/               # Legacy API routes
│       ├── services/             # Core services
│       ├── middleware/           # Express middleware
│       └── server.js             # Server principal
│
├── API.md                        # NEW: API Documentation
└── README.md
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - UI Library
- **Vite 7** - Build tool
- **React Router v7** - Navegación
- **Zustand** - Estado global
- **Framer Motion** - Animaciones
- **Axios** - Cliente HTTP

### Backend
- **Node.js 18+** - Runtime
- **Express 4** - Framework web
- **PostgreSQL 14+** - Base de datos
- **Socket.io** - WebSocket server
- **JWT** - Autenticación

---

## 📊 Estado del Proyecto

### ✅ Phase 1 - Core Infrastructure (COMPLETADO)
- [x] Arquitectura modular (7 módulos)
- [x] UserDirectory (DICT) - Lookup por teléfono tipo Pix
- [x] PaymentEngine (SPI) - Motor de pagos completo
- [x] Blockchain placeholders (USDC, $PESO, RemesaSwap)
- [x] Flujo completo USDC → $PESO → MXN simulado
- [x] Ledger con doble contabilidad extendido
- [x] API Documentation (API.md)
- [x] Sistema de límites diarios
- [x] Pre-registro automático de destinatarios

### ✅ Completado (Previous Work)
- [x] Frontend React completo con UI moderna
- [x] Sistema de ruteo y navegación
- [x] Stores de estado global
- [x] Dashboard principal
- [x] Backend API con Express
- [x] Sistema de autenticación JWT (mock)

### 🚧 Phase 2 - Features Principales (Por Hacer)
- [ ] QR Payments dinámicos
- [ ] Cash-out (SPEI/OXXO)
- [ ] Sistema de seguridad (OTP, PIN)
- [ ] Frontend: Dialogs mejorados
- [ ] Notificaciones push/SMS

### 🚧 Phase 3 - Admin y Optimización (Por Hacer)
- [ ] Panel Admin completo
- [ ] Métricas y reportes
- [ ] Optimizaciones frontend
- [ ] Tests de integración

### 🚧 Phase 4 - Production Ready
- [ ] Integración real con PostgreSQL
- [ ] Servicios externos (Twilio SMS, SPEI, OXXO)
- [ ] Smart contracts deployed
- [ ] Oracle de precio real (Chainlink/CoinGecko)
- [ ] Testing automatizado
- [ ] PWA con service worker

---

## 🧪 Testing

El proyecto funciona con **datos mock**. Para probar:

1. Ejecuta el frontend: `npm run dev`
2. Abre http://localhost:5173
3. Usa el flujo de onboarding (cualquier teléfono funciona)
4. Explora el dashboard con datos de prueba

---

## 📄 Licencia

MIT License

---

**Construido con ❤️ para RemesaLibre**
