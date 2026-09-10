const { z } = require('zod');

const transferSchema = z.object({
    to: z
        .string()
        .length(10, "Account number must be exactly 10 digits"),

    bankCode: z
        .string()
        .optional(), // Optional: if omitted, we handle it smartly in the controller

    amount: z
        .number({ invalid_type_error: "Amount must be a number" })
        .positive("Transfer amount must be greater than zero")
        .max(500000, "Single transfer limit is ₦500,000"),

    narration: z
        .string()
        .max(100, "Narration too long (max 100 characters)")
        .optional()
        .default("Funds Transfer")
});

module.exports = { transferSchema };
