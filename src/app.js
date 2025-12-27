const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
// const billsRoutes = require('./routes/billsRoutes'); // Deprecated

const app = express();

app.use(express.json());
app.use(cors());

// Serve static files (Chat UI)
app.use(express.static(path.join(__dirname, '../public')));

// Logging Middleware
app.use(morgan((tokens, req, res) => {

    const logObject = {
        // Request Level Logs
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        timestamp: tokens.date(req, res, 'iso'),
        ip: tokens['remote-addr'](req, res),
        headers: req.headers,
        request_size: req.headers['content-length'],

        // Response Level Logs
        status: Number(tokens.status(req, res)),
        latency_ms: Number(tokens['response-time'](req, res)),
        response_size: tokens.res(req, res, 'content-length'),


        auth_status: (res.statusCode === 401 || res.statusCode === 403) ? 'FAILED' : 'SUCCESS'
    };

    if (process.env.NODE_ENV === 'development') {
        return JSON.stringify(logObject, null, 2);
    }

    return JSON.stringify(logObject);
}));

// Swagger
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
const mobileProviderRoutes = require('./routes/mobileProviderRoutes');
const bankingRoutes = require('./routes/bankingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authMiddleware = require('./middleware/authMiddleware');

// Apply Auth Middleware to all API routes
app.use('/api/v1', authMiddleware);

app.use('/api/v1/bills', mobileProviderRoutes);
app.use('/api/v1/bills', bankingRoutes);
app.use('/api/v1/bills', adminRoutes);

// Chat Route (API Gateway handles authentication)
app.use('/chat', chatRoutes);

// Serve frontend based on environment
if (process.env.NODE_ENV === 'production') {
    // Production: Serve React build from frontend/dist
    const frontendDistPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendDistPath));

    app.get('/', (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
} else {
    // Development: React runs on separate Vite server (port 3000)
    // Backend just provides APIs on port 8080
    app.get('/', (req, res) => {
        res.json({
            message: 'Backend API running. Frontend is at http://localhost:3000',
            swagger: 'http://localhost:8080/api-docs'
        });
    });
}

module.exports = app;