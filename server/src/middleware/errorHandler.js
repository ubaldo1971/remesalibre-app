// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
};

// Not Found Middleware
export const notFound = (req, res, next) => {
    res.status(404).json({
        error: `Not Found - ${req.originalUrl}`,
    });
};
