require('dotenv').config();
const Customer = require('../models/customer.js');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../schemas/authSchema.js');
const bcrypt = require('bcryptjs');

const register = async (req, res, next)=>{


    try {
        const result = registerSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({errors: result.error.errors})
        }
        const {firstName, lastName, email, password } = result.data;

        // Step two - check if user exist
        const existingCustomer = await Customer.findOne({email});
        if (existingCustomer) {
            return res.status(400).json({ error: "Email already registered" });
        }
        //Step three: Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Step four: create user
        const customer = await Customer.create({firstName, lastName,email,password:hashedPassword})
        return res.status(201).json({message: "Account created successfully",customer: {id: customer._id,firstName: customer.firstName, lastName: customer.lastName,email: customer.email}
        });
    }catch(error){
        next(error)
    }
}

const login = async(req, res, next) => {
    try {

        // Step one check if user type in required field
        const result = loginSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({ errors: result.error.errors });
        }
        const {email , password} = result.data;

        // Step two: find custer by email if they exist
        const existingCustomer = await Customer.findOne({email})
        if (!existingCustomer){
                return res.status(400).json({ error: "Invalid email or password" });
              }
        // Step Three: Compare Password:
        const isMatch = await bcrypt.compare(password, existingCustomer.password)
        if(!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Step 4 - Update last login
        await Customer.findByIdAndUpdate(existingCustomer._id, { lastLogin: new Date() });

        // Step five - generate jwt token

        const token = jwt.sign({customerId: existingCustomer._id, role: existingCustomer.role },process.env.JWT_SECRET, { expiresIn: "1d" });

        // Step Six  - return success + token

        return res.status(200).json({
            message: "Login successful",
            token,
            customer: {id: existingCustomer._id, firstName: existingCustomer.firstName,lastName: existingCustomer.lastName,email: existingCustomer.email,role: existingCustomer.role} });
    }catch (error){
    next(error)}
}
module.exports = { register, login };
