import express from 'express';
export const conversionRouter = express.Router();

conversionRouter.get('/rate', (req, res) => {
    const { from, to } = req.query;
    res.json({ from, to, rate: 17.50, timestamp: new Date().toISOString() });
});

conversionRouter.post('/convert', (req, res) => {
    const { amount, from, to } = req.body;
    const rate = 17.50;
    res.json({
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount: amount * rate,
        convertedCurrency: to,
        rate,
        fee: 0.005,
    });
});

export default conversionRouter;
