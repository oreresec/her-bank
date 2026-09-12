const mongoose = require('mongoose');
const Customer = require('../models/customer.js');
const Account = require('../models/account.js');
const { accountSchema } = require('../schemas/accountSchema.js');
// Import both createBVN and createNIN from the nibssService
const {
    createAccount: createNibssAccount,
    getBalance: getNibssBalance,
    nameEnquiry: getNibssNameEnquiry,
    getAllNibssAccounts,
    createBVN,
    createNIN
} = require('../services/nibssService.js');
const { success } = require('zod');
const Transaction = require('../models/transaction.js');
const { profileUpdateSchema } = require('../schemas/authSchema');

const updateProfile = async (req, res, next) => {
    try {
        // 1. Validate the request body (Make sure your Zod profileUpdateSchema allows 'nin' to be passed!)
        const result = profileUpdateSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        // Extract both bvn and nin (one will be undefined depending on what the user chose)
        const { phone, dateOfBirth, gender, address, nextOfKin, bvn, nin } = result.data;

        // 2. Find customer
        const customerId = req.user.customerId;
        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(400).json({ error: "Customer not found" });
        }

        // 3. Dynamically check which KYC method was passed and call NIBSS
        if (nin) {
            // They chose NIN -> Call NIBSS NIN service
            await createNIN({
                nin: nin,
                firstName: customer.firstName,
                lastName: customer.lastName,
                dob: dateOfBirth
            });
            customer.nin = `*******${nin.slice(-4)}`; // Save masked NIN
            customer.kycType = 'nin';

        } else if (bvn) {
            // They chose BVN -> Call NIBSS BVN service
            await createBVN({
                bvn: bvn,
                firstName: customer.firstName,
                lastName: customer.lastName,
                dob: dateOfBirth,
                phone: phone
            });
            customer.bvn = `*******${bvn.slice(-4)}`; // Save masked BVN
            customer.kycType = 'bvn';

        } else {
            return res.status(400).json({ error: "You must provide either a BVN or a NIN for verification." });
        }

        // 4. Update the rest of the customer's profile details
        customer.phone = phone;
        customer.dateOfBirth = dateOfBirth;
        customer.gender = gender;
        customer.address = address;
        customer.nextOfKin = nextOfKin;
        customer.kycVerified = true;

        // Save the updated customer document to MongoDB
        const updatedCustomer = await customer.save();

        return res.status(200).json({
            message: `Profile updated and verified with NIBSS using ${customer.kycType.toUpperCase()} successfully. You can now generate your bank account!`,
            customer: updatedCustomer
        });

    } catch (error) {
        next(error);
    }
}
module.exports = {updateProfile};
