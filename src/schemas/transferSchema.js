const {z} = require('zod');

const transferSchema = z.object({
    to: z
    .string()
    .length(10, "Account number must be exactly 10 digits"),
    amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(500000, "Single transfer limit is ₦500,000"),
    narration: z
    .string()
    .max(80,"Narration too long")
    .optional()
});
module.exports ={transferSchema};
