const express = require('express');
const { authLimiter } = require('../middleware/rateLimiter')
const router = express.Router();
const {register,login} = require('../controllers/authController')
const { updateProfile } = require('../controllers/customerController');
const auth = require('../middleware/auth');
const { getAccountDetails } = require('../controllers/accountController');


router.post('/register', authLimiter, register);
router.post('/login', authLimiter , login)
router.patch('/profile', auth, updateProfile);
router.get('/details', auth, getAccountDetails);




module.exports = router;
