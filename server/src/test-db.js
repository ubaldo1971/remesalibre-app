console.log('Testing db service import');
import { db } from './services/db.service.js';
console.log('DB Service imported');
console.log('Users:', db.users.length);
