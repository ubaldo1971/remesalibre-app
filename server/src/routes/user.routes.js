// Mock route files - Can be expanded later
import express from 'express';

// User Routes
const userRouter = express.Router();
userRouter.get('/profile', (req, res) => {
    res.json({ id: '1', firstName: 'Usuario', lastName: 'Demo', phone: '+52123456789' });
});
userRouter.put('/profile', (req, res) => {
    res.json({ success: true, message: 'Profile updated' });
});

// Export with default names expected by server.js
export default userRouter;
