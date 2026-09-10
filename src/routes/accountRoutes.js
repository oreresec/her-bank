const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {createAccount,getBalance,getAccountDetails,nameEnquiry} = require('../controllers/accountController');

// All account endpoints require Customer JWT authentication
router.post('/create', auth, createAccount);
router.get('/balance', auth, getBalance);
router.get('/details', auth, getAccountDetails);
router.get('/name-enquiry/:accountNo', auth, nameEnquiry);

module.exports = router;
