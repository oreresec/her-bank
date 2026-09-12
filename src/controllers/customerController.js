const mongoose = require('mongoose');
const Customer = require('../models/customer.js');
const Account = require('../models/account.js');
const { accountSchema } = require('../schemas/accountSchema.js');
const {createAccount: createNibssAccount, getBalance: getNibssBalance,nameEnquiry: getNibssNameEnquiry, getAllNibssAccounts, createBVN: createBVN } = require('../services/nibssService.js');
const { success } = require('zod');
const Transaction = require('../models/transaction.js');
const { profileUpdateSchema } = require('../schemas/authSchema');

const updateProfile = async (req, res, next)=>{

    try {
        const result = profileUpdateSchema.safeParse(req.body);
         if(!result.success){
            return res.status(400).json({ errors: result.error.errors });
         }
         const { phone, dateOfBirth, gender, address, nextOfKin, bvn } = result.data;
         // Find customer using the customerId

         const customerId = req.user.customerId ;
         const customer = await Customer.findByIdAndUpdate( customerId,{
            phone,dateOfBirth,gender,address,nextOfKin,bvn,kycVerified: true}, { new: true, runValidators: true });

            if(!customer){
                return res.status(400).json({error: "Customer not found"});

            }
            // Step 3: Automatically seed/register the BVN with NIBSS first
            await createBVN ({bvn: bvn,firstName: customer.firstName,lastName: customer.lastName,dob: dateOfBirth,phone: phone});
        // Step 4: Update local database once NIBSS verification succeeds

        const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            {phone,dateOfBirth,gender,address,nextOfKin,bvn,kycVerified: true},{ new: true, runValidators: true });
  return res.status(200).json({message: "Profile updated and verified with NIBSS successfully. You can now generate your bank account!" , customer: updatedCustomer })
    }catch(error){
        next(error)
    }
}
module.exports = {updateProfile};
