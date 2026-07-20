import express from 'express';
export const cashoutRouter = express.Router();

cashoutRouter.post('/spei', (req, res) => {
    const { amount, clabe } = req.body;
    res.json({
        success: true,
        reference: 'SPEI-' + Date.now(),
        amount,
        clabe,
        status: 'pending',
    });
});

cashoutRouter.post('/oxxo', (req, res) => {
    const { amount } = req.body;
    res.json({
        success: true,
        barcode: '1234567890123',
        reference: 'OXXO-' + Date.now(),
        amount,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
});

cashoutRouter.get('/history', (req, res) => {
    res.json([]);
});

export default cashoutRouter;
