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

app.use('/api/v1/bills', mobileProviderRoutes);
app.use('/api/v1/bills', bankingRoutes);
app.use('/api/v1/bills', adminRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'SE 4458 Mobile Provider API is running!',
        docs: '/api-docs'
    });
});

module.exports = app;