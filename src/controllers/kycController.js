
const Customer = require('../models/customer.js');
const {createBVN,createNIN,validateBVN,validateNIN} = require('../services/nibssService.js');
const { bvnSchema, ninSchema, validateBvnSchema, validateNinSchema } = require('../schemas/kycSchema.js');

exports.createBvn = async (req, res, next) => {

    try {
        // Step one check if user type in required field
        const result = bvnSchema.safeParse(req.body);
        if(!result.success){
             return res.status(400).json({ errors: result.error.errors });
            }
        const {bvn,dob} = result.data;

        // Step Two  check if customer already have bvn
        const  customer = await Customer.findById(req.user.customerId)
        if(!customer){
            return res.status(400).json({message: "Customer not found"});
        }
        if(customer.bvn){
            return res.status(400).json({ message: 'Customer already has a BVN linked' });
        }
        // Step Three: Call NIBSS service to create/verify BVN
        const nibssResponse = await createBVN({bvn, firstName: customer.firstName,lastName: customer.lastName,dob,phone: customer.phone, });

        //Step Four - Masked BVN
        const maskedBvn = `*******${bvn.slice(-4)}`;

        // Step Five : Update customer record upon successful verification/creation
        customer.bvn = maskedBvn;
        customer.kycVerified= true;
        customer.kycType = 'bvn';
        await customer.save()

        // Step Six - Return success
        return res.status(200).json({message: 'BVN verified successfully', data: {kycVerified: customer.kycVerified,kycType: customer.kycType,bvn: customer.bvn, nibss: nibssResponse, },
    });
    }catch (error){
        next(error)
    }
}

exports.createNin = async (req, res, next) => {
    try{
        // Step One - Zod validate with ninSchema
        const result = ninSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({ errors: result.error.errors });
        }
        const { nin, dob} = result.data

        // Step Two - Get customer info from database using req.user.customerId
        const customer = await Customer.findById(req.user.customerId);
        if(!customer){
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Step Three - Check customer doesn't already have a NIN linked
        if(customer.nin){
            return res.status(400).json({ message: 'Customer already has a NIN linked' });
        }
        // Step Four - Call nibssService.createNIN() with full NIN + dob + DB customer info
        const nibssResponse = await createNIN({nin,firstName,lastName,dob});

        //Step Five - Mask NIN (Keep last 4 digits)
        const maskedNin = `*******${nin.slice(-4)}`;

        // Step Five -  Update customer profile  save masked NIN, set kycVerified: true, kycType: "nin"
        customer.nin = maskedNin;
        customer.kycVerified = true;
        customer.kycType = 'nin';
        await customer.save();
        // Step Six - Return success

        return res.status(200).json({message: "NIN verified successfully", data: {kycVerified: customer.kycVerified,kycType: customer.kycType,nin: customer.nin,nibss: nibssResponse,},
    })
  }catch(error){
        next(error)
    }
}

exports.validateBvn = async (req, res,next )=> {
    try {
        // Step One - Validate request body with Zod
        const result = validateBvnSchema.safeParse(req.body)
        if (!result.success){
            return res.status(400).json({ errors: result.error.errors });
        }
        const {bvn} = result.data
        // Step Two - Call nibbs
         const nibbsResponse = await validateBVN(bvn)

         // Step 3: Send back NIBSS response
         return res.status(200).json({message: 'BVN validation successful',data: nibbsResponse});

    }catch(error){
        next(error)
    }
}
exports.validateNin = async (req, res, next) => {
  try {
    // Step 1: Validate request body with Zod
    const result = validateNinSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.errors });
    }

    const { nin } = result.data;

    // Step 2: Call NIBSS service with the raw NIN string
    const nibssResponse = await validateNIN(nin);

    // Step 3: Send back NIBSS response
    return res.status(200).json({message: 'NIN validation successful',data: nibssResponse,});
  } catch (error) {
    next(error);
  }
};
