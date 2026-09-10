const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler.js');


const app = express();

// Parse incoming json
app.use(express.json());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message:{error: "Too many requests, please try again later"},
    standardHeaders: true,
    legacyHeaders: false
})
app.use(globalLimiter);

// Routes

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/account', require('./routes/accountRoutes'));
app.use('/api/transfer', require('./routes/transferRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));


// Error handler — must always be last
app.use(errorHandler);

module.exports = app;
