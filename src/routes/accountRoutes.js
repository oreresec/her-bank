const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly')
const {createAccount,getBalance,getAccountDetails,nameEnquiry,getAllAccounts , getAccountBalance , getTransactionHistory} = require('../controllers/accountController');

// All account endpoints require Customer JWT authentication
router.post('/create', auth, createAccount);
router.get('/balance', auth, getBalance); // or getAccountBalance depending on which you prefer
router.get('/details', auth, getAccountDetails);
router.get('/name-enquiry/:accountNo', auth, nameEnquiry);
router.get('/transactions', auth, getTransactionHistory); // Added transaction history here!
router.get('/all', auth, adminOnly, getAllAccounts);
module.exports = router;



