const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 6,
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});
const transferLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { error: "Too many transfer attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { authLimiter, transferLimiter };
