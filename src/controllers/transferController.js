const mongoose = require('mongoose');
const Account = require('../models/account');
const Customer = require('../models/customer');
const Transaction = require('../models/transaction');
const { transferSchema } = require('../schemas/transferSchema');
const { nameEnquiry, getTransaction, transfer } = require('../services/nibssService');
const generateRef = require('../utils/generateRef');

const transferMoney = async (req, res) => {
    try {
        const validatedData = transferSchema.parse(req.body);
        let { to, bankCode, amount, narration } = validatedData;
        const senderCustomerId = req.user.customerId;

        let isInternal = false;
        let recipientName = "";

        const [senderProfile, senderAccount] = await Promise.all([
            Customer.findById(senderCustomerId),
            Account.findOne({ customerId: senderCustomerId })
        ]);

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
            $or: [{ accountNumber: to }, { accountNumber: Number(to) }]
        });

        // 2. Handle missing bankCode
        if (!bankCode) {
            if (localRecipient) {
                bankCode = localRecipient.bankCode || "254";
            } else {
                return res.status(400).json({ error: "Bank code is required for external interbank transfers." });
            }
        }

        // Generate  unique local tracking reference first
        const localReference = generateRef();
        let externalTransferResponse = null;

        if (localRecipient) {
            isInternal = true;
            recipientName = localRecipient.customerId ?
                (await Customer.findById(localRecipient.customerId))?.firstName + " " + (await Customer.findById(localRecipient.customerId))?.lastName :
                "Local Account Holder";
        } else {
            isInternal = false;
            try {
                // Name enquiry check
                const enquiryResult = await nameEnquiry(to, bankCode);
                const payload = enquiryResult.data || enquiryResult;
                recipientName = payload.accountName;

                // Call the external NIBSS transfer API switch synchronously
                externalTransferResponse = await transfer({ from,to,amount: String(amount),bankCode,narration,reference: localReference});
            } catch (err) {
                console.error("NIBSS Transfer/Name Enquiry Error:", err.response?.data || err.message);
                return res.status(400).json({ error: "External interbank transfer failed or NIBSS network down." });
            }
        }

        // Extract official NIBSS transaction ID if external, otherwise fallback to local reference
        const remoteTransactionId = isInternal
            ? localReference
            : (externalTransferResponse?.transactionId || externalTransferResponse?.data?.transactionId || externalTransferResponse?.reference || localReference);

        // PHASE 2: ESCROW & ATOMIC DEBIT LOCK
        const escrowSession = await mongoose.startSession();
        escrowSession.startTransaction();

        let completedTransaction;

        try {
            // Atomic Debit Lock on Sender Account
            const updatedSender = await Account.findOneAndUpdate(
                { accountNumber: senderAccount.accountNumber, balance: { $gte: amount } },
                { $inc: { balance: -amount } },
                { returnDocument: 'after', session: escrowSession }
            );
            if (!updatedSender) {
                throw new Error("Insufficient funds during lock.");
            }

            const finalStatus = "SUCCESS";

            // Create Transaction Record for the SENDER
            const txData = [{
                customerId: senderCustomerId,
                reference: localReference,          
                transactionId: remoteTransactionId, // Official NIBSS switch transaction ID
                from,
                to,
                recipientBankCode: bankCode,
                recipientName,
                amount,
                type: isInternal ? "INTRA" : "INTER",
                status: finalStatus,
                narration
            }];

            const createdTx = await Transaction.create(txData, { session: escrowSession });
            completedTransaction = createdTx[0];

            // If INTRA, credit recipient locally AND create their transaction log
            if (isInternal) {
                const recipientAccount = await Account.findOneAndUpdate(
                    { $or: [{ accountNumber: to }, { accountNumber: Number(to) }] },
                    { $inc: { balance: amount } },
                    { returnDocument: 'after', session: escrowSession }
                );

                if (recipientAccount) {
                    const senderFullName = `${senderProfile.firstName} ${senderProfile.lastName}`.trim();

                    // 💡 DUAL-SIDED LOGGING: Create matching Transaction record for the RECIPIENT
                    await Transaction.create([{ customerId: recipientAccount.customerId, reference: localReference,
                        transactionId: `${remoteTransactionId}-REC`,
                        from, to,recipientBankCode: bankCode,recipientName: senderFullName,  amount,
                        type: "INTRA",status: finalStatus,narration: narration || "Internal transfer received"
                    }], { session: escrowSession }); }}

            await escrowSession.commitTransaction();
            escrowSession.endSession();
        } catch (dbError) {
            await escrowSession.abortTransaction();
            escrowSession.endSession();

            console.error("CRITICAL DB ERROR IN PHASE 2:", dbError.message);
            return res.status(400).json({ error: `Transfer aborted: ${dbError.message}` });
        }

        // PHASE 3: FINAL RESPONSE
        return res.status(200).json({
            message: isInternal ? "Internal transfer successful" : "Transfer successful",
            data: completedTransaction,
            status: "SUCCESS"
        });

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

        // Try polling NIBSS for the live status safely
        let realStatus = "PENDING";
        try {
            const nibssResponse = await getTransaction(transaction.transactionId);
            realStatus = nibssResponse.data?.status || nibssResponse.status;
        } catch (axiosError) {
            // If the external sandbox returns a 404 or fails, gracefully fallback to local PENDING state
            if (axiosError.response && axiosError.response.status === 404) {
                return res.status(200).json({
                    message: "Transaction is pending on the settlement network (External sandbox record not yet active)",
                    data: transaction,
                    status: "PENDING"
                });
            }
            throw axiosError; // Re-throw if it's a completely different server error
        }

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
