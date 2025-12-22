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

// Chat Route (Optional: Protected or Public? User requested "API_KEY to add auth to endpoints")
// Let's protect it too for consistency, or the UI won't work easily without the key.
// But the UI is static HTML.
app.use('/chat', authMiddleware, chatRoutes);

app.get('/', (req, res) => {
    // Send the Chat UI file
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;