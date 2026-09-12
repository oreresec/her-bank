const mongoose = require('mongoose');
const Customer = require('../models/customer.js');
const Account = require('../models/account.js');
const { accountSchema } = require('../schemas/accountSchema.js');
const {createAccount: createNibssAccount, getBalance: getNibssBalance,nameEnquiry: getNibssNameEnquiry, getAllNibssAccounts} = require('../services/nibssService.js');
const { success } = require('zod');
const Transaction = require('../models/transaction.js');

exports.createAccount = async (req, res, next) => {
  try {
    // Step One - Validate input with Zod
    const result = accountSchema.safeParse(req.body);
    if (!result.success) {
        console.log('[REQ.BODY RECEIVED]:', req.body);
  console.log('[RAW ZOD ERROR OBJECT]:', result.error);
      return res.status(400).json({ errors: result.error.errors });
    }
    const { kycType, kycID, dob } = result.data;

    // Step Two - Find customer
    const customer = await Customer.findById(req.user.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Step Three - Check if KYC is verified
    if (!customer.kycVerified) {
      return res.status(400).json({ message: 'KYC verification required before opening an account.' });
    }

    // Step Four - Check if customer already has an account
    const existingAccount = await Account.findOne({ customerId: customer._id });
    if (existingAccount) {
      return res.status(400).json({ message: 'Customer already has an active bank account.' });
    }

    // Step Five - Define payload first, then log and call NIBSS
    const payload = {
      kycType: kycType.toLowerCase(),
      kycID,
      dob,
    };

    console.log('[NIBSS REQUEST PAYLOAD]:', payload);
    const nibssResponse = await createNibssAccount(payload);

    // Extract nested payload safely
    const accountData = nibssResponse.account || nibssResponse.data || nibssResponse;

    // Log NIBSS response to see the exact structure
    console.log('[DEBUG NIBSS ACCOUNT PAYLOAD]:', accountData);

    // Step Six - Save Account to DB
    const account = await Account.create({
      customerId: customer._id,
      accountNumber: accountData.accountNumber || accountData.accountNo,
      bankCode: accountData.bankCode || '108',
      bankName: accountData.bankName || 'HER Bank',
      balance: accountData.balance || 15000,
    });

    // Step Seven - Update Customer model
    customer.accountNumber = account.accountNumber;
    customer.bankCode = account.bankCode;
    customer.bankName = account.bankName;
    customer.balance = account.balance;
    await customer.save();

    // Step Eight - Return Response with populated account object
    return res.status(201).json({
      message: 'Account created successfully',
      data: account
    });

  } catch (error) {
    console.error('[CREATE ACCOUNT CONTROLLER ERROR FULL]:', error);
    if (error.response) {
      console.error('[NIBSS API ERROR RESPONSE]:', error.response.data);
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      nibssError: error.response?.data || null
    });
  }
};

exports.getBalance = async (req, res, next) => {
  try {
    const rawCustomerId = req.user?.customerId || req.customer?.customerId;
    console.log('[DEBUG 1] Decoded customerId from JWT:', rawCustomerId);

    const account = await Account.findOne({
      customerId: new mongoose.Types.ObjectId(rawCustomerId),
    });
    console.log('[DEBUG 2] Mongo Account Document:', account);

    if (!account) {
      return res.status(404).json({
        message: 'No bank account found for this customer. Please create an account first.',
      });
    }

    console.log('[DEBUG 3] Account Number being sent to NIBSS:', account.accountNumber);

    // Call NIBSS service
    const nibssResponse = await getNibssBalance(account.accountNumber);
    console.log('[DEBUG 4] NIBSS Raw Response:', nibssResponse);

    // Sync balance
    account.balance = nibssResponse.balance;
    await account.save();

    return res.status(200).json({
      message: 'Account balance retrieved successfully',
      data: {
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        balance: account.balance,
      },
    });
  } catch (error) {
    console.error('[DEBUG ERROR] getBalance Error Catch:', error.response?.data || error.message);
    next(error);
  }
};

exports.nameEnquiry = async (req, res, next) => {
  try {
    const accountNo = req.body.accountNo || req.body.accountNumber;

    // Validate 10-digit NUBAN length
    if (!accountNo || accountNo.length !== 10 || !/^\d{10}$/.test(accountNo)) {
      return res.status(400).json({message: 'Invalid account number. Must be a 10-digit numeric NUBAN string.',});
    }

    // Call NIBSS service for account verification
    const nibssResponse = await getNibssNameEnquiry(accountNo);
    return res.status(200).json({message: 'Name enquiry successful',data: nibssResponse,});
  } catch (error) {
    next(error);
  }
};

exports.getAccountDetails = async (req, res, next) => {
  try {
    const account = await Account.findOne({ customerId: req.user.customerId }).populate('customerId');;
    if (!account) {
      return res.status(404).json({message: 'No bank account found for this customer.',}); }


      // Use account.customerId (which holds the populated document)
     const cust = account.customerId || {};

    return res.status(200).json({
      message: 'Account Profile retrieved successfully',
      data: {
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        bankCode: account.bankCode,
        balance: account.balance,
        isActive: account.isActive,
        createdAt: account.createdAt,
        // Grab these from the populated User model
        email: cust.email,
        phone: cust.phone,
        bvn: cust.bvn,
        nin: cust.nin,
        kycVerified: cust.kycVerified,
        address: cust.address,
        nextOfKin: cust.nextOfKin,
        firstName: cust.firstName,
        lastName: cust.lastName,},});
  } catch (error) {
    next(error);
  }
};

exports.getAllAccounts = async (req, res, next) => {
    try {
        const nibssResponse = await getAllNibssAccounts();
        return res.status(200).json({message: "Accounts retrieved successfully",data: nibssResponse});
    } catch (error) {
        next(error);
    }
};
exports.getAccountBalance = async (req, res, next) => {
    try {
        const customerId = req.user.customerId;
        const account = await Account.findOne({ customerId });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        let liveBalance = account.balance;

        // 1. Ask NIBSS for the live ledger balance in real time
        try {
            const nibssData = await getNibssBalance(account.accountNumber);
            const nibssBalance = Number(nibssData.balance || nibssData.data?.balance);

            if (!isNaN(nibssBalance) && nibssBalance !== account.balance) {
                // If NIBSS has a higher balance, an external credit happened!
                if (nibssBalance > account.balance) {
                    const diff = nibssBalance - account.balance;const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const nibssTransactionId = `TSQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // NIBSS Transaction ID

    // Auto-log the incoming external transaction
    await Transaction.create({
        customerId: customerId,
        reference: `HER-${dateStr}-EXT`,    // Satisfies your schema's required 'reference' field
        transactionId: nibssTransactionId, // 👈 Captured NIBSS Transaction ID for external transfers
        from: "EXTERNAL-BANK",
        to: account.accountNumber,
        amount: diff,
        status: 'SUCCESS',
        type: 'INTER',                     // Inter-bank transfer type
        recipientName: 'External Deposit', // Displays nicely in your table
        narration: 'Inbound transfer via NIBSS'
                    });
                }

                // Update local MongoDB balance to match NIBSS truth
                account.balance = nibssBalance;
                await account.save();
                liveBalance = nibssBalance;
            }
        } catch (nibssErr) {
            console.error("Live NIBSS balance check skipped/failed, using local DB:", nibssErr.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                accountNumber: account.accountNumber,
                balance: liveBalance,
                currency: "NGN",
                status: account.status || "ACTIVE"
            }
        });

    } catch (error) {
        next(error);
    }
};
exports.getTransactionHistory = async (req, res, next) => {
    console.log("HIT THE GET TRANSACTION HISTORY CONTROLLER!");
    try {

        const customerId = req.user.customerId;
        const transactions = await Transaction.find({ customerId }).sort({ createdAt: -1 }).limit(51);
         return res.status(200).json({success: true,count: transactions.length,data: transactions});
    } catch (error) {
        next(error);
    }
};
