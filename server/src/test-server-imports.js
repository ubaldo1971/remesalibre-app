console.log('Testing server imports');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

import './routes/auth.routes.js';
import './routes/user.routes.js';
import './routes/wallet.routes.js';
import './routes/transaction.routes.js';
import './routes/cashout.routes.js';
import './routes/conversion.routes.js';
import './routes/admin.routes.js';

console.log('All imports successful');
