const express = require('express');
const router = express.Router();
const { transferMoney, checkTransferStatus,} = require('../controllers/transferController');
const {getTransactionHistory, getAccountBalance } = require('../controllers/accountController');
const auth = require('../middleware/auth'); // Your JWT middleware

// POST /api/transfer/send
router.post('/send', auth, transferMoney);

// New Transaction Status Query (TSQ) route
router.get('/status/:reference', auth, checkTransferStatus);


module.exports = router;
