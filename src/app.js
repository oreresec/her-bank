const express = require('express');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler.js');
const accountRoutes = require('./routes/accountRoutes');



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
app.use('/api/accounts', require('./routes/accountRoutes'));   // Plural
app.use('/api/transfers', require('./routes/transferRoutes')); // Plural
app.use('/api/admin', require('./routes/adminRoutes'));


// Error handler — must always be last
app.use(errorHandler);

module.exports = app;
