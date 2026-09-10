const express = require('express');
const router = express.Router();
const { transferMoney } = require('../controllers/transferController');
const auth = require('../middleware/auth'); // Your JWT middleware

// POST /api/transfer/send
router.post('/send', auth, transferMoney);

module.exports = router;
