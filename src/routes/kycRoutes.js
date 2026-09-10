const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {createBvn,createNin,validateBvn,validateNin,} = require('../controllers/kycController');



// All KYC endpoints require Customer JWT authentication
router.post('/bvn', auth, createBvn);
router.post('/nin', auth, createNin);
router.post('/validate/bvn', auth, validateBvn);
router.post('/validate/nin', auth, validateNin);




module.exports = router;
