const mongoose = require('mongoose');
const Account = require('../models/account');
const Customer = require('../models/customer');
const Transaction = require('../models/transaction');
const { transferSchema } = require('../schemas/transferSchema');
const { nameEnquiry, getTransaction } = require('../services/nibssService');
const generateRef = require('../utils/generateRef');

const transferMoney = async (req, res) => {
    try {

        // PHASE 1: VALIDATION & SMART DETECTION

        const validatedData = transferSchema.parse(req.body);


        let { to, bankCode, amount, narration } = validatedData;
        const senderCustomerId = req.user.customerId;

        // Declare tracking variables securely at the top
        let isInternal = false;
        let recipientName = "";

        const [senderProfile, senderAccount] = await Promise.all([ Customer.findById(senderCustomerId),Account.findOne({ customerId: senderCustomerId })]);

        if (!senderProfile || !senderAccount) {
            return res.status(404).json({ error: "Sender profile or account not found" });
        }
        if (!senderProfile.isActive || !senderAccount.isActive) {
            return res.status(403).json({ error: "Account is inactive. Transfer blocked." });
        }

        const from = senderAccount.accountNumber;

        if (from === to) {
            return res.status(400).json({ error: "Cannot transfer to your own account." });
        }
        if (senderAccount.balance < amount) {
            return res.status(400).json({ error: "Insufficient funds." });
        }

        // 1. Check local DB FIRST before validating bankCode

        const localRecipient = await Account.findOne({
            $or: [ { accountNumber: to }, { accountNumber: Number(to) }]});

        // 2. Handle missing bankCode based on whether it's local or external
        if (!bankCode) {
            if (localRecipient) {bankCode = localRecipient.bankCode || "254"; // Safe fallback for local internal transfers
            } else {
                return res.status(400).json({ error: "Bank code is required for external interbank transfers." });
            }
        }

        if (localRecipient) {isInternal = true;
            if (localRecipient.customerId) {
                const customer = await Customer.findById(localRecipient.customerId);
                recipientName = customer ? `${customer.firstName} ${customer.lastName}` : "Local Account Holder";
            } else {
                recipientName = "Local Account Holder";
            }
        } else {
            isInternal = false;
            try {
                const enquiryResult = await nameEnquiry(to, bankCode);
                const payload = enquiryResult.data || enquiryResult;
                recipientName = payload.accountName;
            } catch (err) {
                console.error("NIBSS Name Enquiry Error:", err.message);
                return res.status(400).json({ error: "Invalid external account or NIBSS network down." });
            }
        }

        // PHASE 2: ESCROW & ATOMIC DEBIT LOCK
        const reference = generateRef();
        const escrowSession = await mongoose.startSession();
        escrowSession.startTransaction();

        let pendingTransaction;

        try {
            // Atomic Debit Lock on Sender Account
            const updatedSender = await Account.findOneAndUpdate(
                { accountNumber: senderAccount.accountNumber, balance: { $gte: amount } },{ $inc: { balance:-amount } },{ returnDocument: 'after', session: escrowSession }
            );
              if (!updatedSender) {
                throw new Error("Insufficient funds during lock.");
            }

            // Create Ledger Entry
            const txData = [{
                customerId: senderCustomerId,
                reference,
                transactionId: reference,
                from,
                to,
                recipientBankCode: bankCode,
                recipientName,
                amount,
                type: isInternal ? "INTRA" : "INTER",
                status: isInternal ? "SUCCESS" : "PENDING",
                narration
            }];

            const createdTx = await Transaction.create(txData, { session: escrowSession });
            pendingTransaction = createdTx[0];

            // If INTRA, credit recipient in the same session
            if (isInternal) {
                await Account.findOneAndUpdate({ $or: [{ accountNumber: to }, { accountNumber: Number(to) }] },{ $inc: { balance: amount } },{ session: escrowSession });}

            await escrowSession.commitTransaction();
            escrowSession.endSession();
        } catch (dbError) {
            await escrowSession.abortTransaction();
            escrowSession.endSession();

            console.error("CRITICAL DB ERROR IN PHASE 2:", dbError.message);
            return res.status(400).json({ error: `Transfer aborted: ${dbError.message}` });
        }

        // PHASE 3: FINAL RESPONSE
        if (isInternal) {
            return res.status(200).json({
                message: "Internal transfer successful",
                data: pendingTransaction
            });
        } else {
            return res.status(200).json({
                message: "Transfer is pending confirmation from the settlement network. Please check status later.",
                data: pendingTransaction
            });
        }
    } catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



const checkTransferStatus = async (req, res, next) => {
    try {
        const { reference } = req.params;
        const customerId = req.user.customerId;

        const transaction = await Transaction.findOne({ reference, customerId });
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found or you do not have permission to view it." });
        }

        // If it's already completed or internal, just return it directly
        if (transaction.status !== "PENDING" || transaction.type !== "INTER") {
            return res.status(200).json({
                message: "Transaction status retrieved successfully",
                data: transaction
            });
        }

        // If it's a pending inter-bank transfer, poll NIBSS for the live status
        const nibssResponse = await getTransaction(transaction.transactionId);
        const realStatus = nibssResponse.data?.status || nibssResponse.status;

        if (realStatus === "SUCCESS") {
            transaction.status = "SUCCESS";
            await transaction.save();
            return res.status(200).json({
                message: "Transaction is successful",
                data: transaction,
                status: realStatus
            });
        }

        if (realStatus === "FAILED") {
            transaction.status = "FAILED";
            await transaction.save();

            // Refund the sender — money was held in escrow but transfer failed
            await Account.findOneAndUpdate(
                { accountNumber: transaction.from },
                { $inc: { balance: transaction.amount } }
            );

            return res.status(200).json({
                message: "Transaction failed and has been refunded",
                data: transaction,
                status: realStatus
            });
        }

        // Default fallback if NIBSS still says pending
        return res.status(200).json({
            message: "Transaction is still pending on the settlement network",
            data: transaction,
            status: realStatus
        });

    } catch (error) {
        next(error);
    }
};
module.exports = { transferMoney, checkTransferStatus };
