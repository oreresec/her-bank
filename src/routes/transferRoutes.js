const express = require('express');
const router = express.Router();
const { transferMoney, checkTransferStatus,} = require('../controllers/transferController');
const {getTransactionHistory, getAccountBalance, nameEnquiry} = require('../controllers/accountController');
const auth = require('../middleware/auth'); // Your JWT middleware

// DEBUG LOGS: Check if these are functions or undefined
console.log('[DEBUG] auth middleware is:', typeof auth);
console.log('[DEBUG] nameEnquiry controller is:', typeof nameEnquiry);

// POST /api/transfer/send
router.post('/send', auth, transferMoney );

// New Transaction Status Query (TSQ) route
router.get('/status/:reference', auth, checkTransferStatus);
router.post('/name-enquiry', auth,nameEnquiry);


module.exports = router;
