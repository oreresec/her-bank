const mongoose = require('mongoose');
const accountSchema = new mongoose.Schema({
    customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    unique: true  // one account per customer
},
accountNumber: {
    type: String,
    unique: true,
    maxlength: 11
},
bankCode:{type:String},
bankName:{type:String},
balance:{type: Number, default:15000},
isActive: {type: Boolean, default: true}
},
{timestamps: true});
const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
