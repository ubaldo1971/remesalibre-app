import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import routes
import authRoutes from './routes/auth.routes.js';
// import userRoutes from './routes/user.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
// import cashoutRoutes from './routes/cashout.routes.js';
import conversionRoutes from './routes/conversion.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Import new modular routes
import userDirectoryRoutes from './modules/userDirectory/userDirectory.routes.js';
import qrRoutes from './modules/qr/qr.routes.js';
import cashoutRoutes from './modules/cashout/cashout.routes.js';
import donationRoutes from './routes/donation.routes.js';
import votingRoutes from './routes/voting.routes.js';
import raiteRoutes from './modules/raite/raite.routes.js';
import escrowRoutes from './modules/escrow/escrow.routes.js';
// Note: authRoutes and adminRoutes already imported above from ./routes/

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Initialize app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },
});

// Middleware
app.use(helmet());
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000', // Admin Dashboard
    'http://127.0.0.1:3000',
    'http://localhost:3002'  // Raite Chofer App
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userDirectoryRoutes);
app.use('/api/qr', qrRoutes);
// app.use('/api/user', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cashout', cashoutRoutes);
app.use('/api/conversion', conversionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/raite', raiteRoutes);
app.use('/api/escrow', escrowRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Real-time transaction updates
    socket.on('subscribe_transactions', (userId) => {
        socket.join(`user_${userId}`);
    });

    // ----------------------------------------------------
    // Delivery Tracking System
    // ----------------------------------------------------

    // Cliente/Web: Unirse al canal de tracking de una orden específica
    socket.on('track_order', (trackingNumber) => {
        console.log(`Socket ${socket.id} tracking order: ${trackingNumber}`);
        socket.join(`tracking_order_${trackingNumber}`);
    });

    // Conductor: Enviar actualización de ubicación
    socket.on('driver_location_update', (data) => {
        // data: { trackingNumber, lat, lng, heading, speed }
        const { trackingNumber, lat, lng, heading } = data;

        // Retransmitir a todos los que rastrean esta orden (Cliente Tracking Page)
        io.to(`tracking_order_${trackingNumber}`).emit('order_location_updated', {
            lat,
            lng,
            heading,
            updatedAt: new Date()
        });
    });

    // Conductor: Notificar cambio de estado (Recogido/Entregado)
    socket.on('order_status_change', (data) => {
        const { trackingNumber, status, description } = data;
        io.to(`tracking_order_${trackingNumber}`).emit('order_status_updated', {
            status,
            description,
            updatedAt: new Date()
        });
    });
});

// Export io for use in other modules
export { io };

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║   RemesaLibre API Server Running     ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
║   Time: ${new Date().toLocaleString()}   ║
╚══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
});
