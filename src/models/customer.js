const mongoose = require('mongoose');
const customerSchema = new mongoose.Schema({
    // Personal Information
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true
    },
    dateOfBirth: {
        type: String
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },

    // Address
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String},
        country: { type: String },
        postalCode: { type: String }
    },

    // Next of Kin
    nextOfKin: {
        name: { type: String},
        phone: { type: String},
        relationship: { type: String },
        address: { type: String }
    },

    // KYC
    bvn: { type: String },
    nin: { type: String },
    kycType: { type: String, enum: ["bvn", "nin", null] },
    kycVerified: { type: Boolean, default: false },

    // Bank Account
    accountNumber: { type: String },
    bankCode: { type: String },
    bankName: { type: String },

    // System
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    dailyTransferTotal: {
        type: Number,
        default: 0
    },
    dailyLimitResetAt: {
        type: Date
    }

}, { timestamps: true });

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
