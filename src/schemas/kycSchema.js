const { z } = require('zod');

const bvnSchema = z.object({
    bvn: z.string().length(11,"BVN must be exactly 11 digits").regex(/^\d{11}$/, "BVN must contain only numbers"),
    firstName: z.string().min(2).trim(),
    lastName: z.string().min(2).trim(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    phone: z.string().min(11).max(11)
});

const ninSchema= z.object({
    nin: z.string().length(11, "NIN must be exactly 11 digits").regex(/^\d{11}$/, "NIN must contain only numbers"),
    firstName : z.string().min(2).trim(),
    lastName: z.string().min(2).trim(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
});

const validateBvnSchema = z.object({
    bvn: z.string().length(11, "BVN must be exactly 11 digits").regex(/^\d{11}$/, "BVN must contain only numbers")
});

const validateNinSchema = z.object({
    nin: z.string().length(11, "NIN must be exactly 11 digits").regex(/^\d{11}$/, "NIN must contain only numbers")
});

module.exports = { bvnSchema, ninSchema, validateBvnSchema, validateNinSchema };
