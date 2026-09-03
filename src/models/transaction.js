const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // Who initiated this transaction
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },

    // Her  bank's internal reference — generated before calling NIBSS
    reference: {
        type: String,
        required: true,
        unique: true
    },

    // NIBSS transaction ID — comes back after transfer
    transactionId: {
        type: String,
        unique: true
    },

    // Sender and recipient account numbers
    from: { type: String, required: true },
    to: { type: String, required: true },

    // Amount in Naira
    amount: {
        type: Number,
        required: true
    },

    // Transaction status — starts PENDING, updated after NIBSS responds
    status: {
        type: String,
        enum: ["SUCCESS", "PENDING", "FAILED"],
        default: "PENDING"
    },

    // INTRA = within HER Bank, INTER = to another bank
    type: {
        type: String,
        enum: ["INTRA", "INTER"]
    },

    // Optional description
    narration: {
        type: String
    },

    // Recipient name from name enquiry
    recipientName: {
        type: String
    }

}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
