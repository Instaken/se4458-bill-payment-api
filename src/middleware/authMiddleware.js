const authMiddleware = (req, res, next) => {
    // 1. Get the API Key from headers or query params
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    // 2. Check if API Key is present and valid
    if (!apiKey || apiKey !== process.env.API_KEY) {
        // If invalid, return 401 Unauthorized
        return res.status(401).json({
            error: 'Unauthorized: Invalid or missing API Key'
        });
    }

    // 3. If valid, proceed to the next middleware/route handler
    next();
};

module.exports = authMiddleware;
