const { z } = require('zod');

// Reusable password schema

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must be at most 50 characters")
    .refine((p) => /[A-Z]/.test(p), { message: "Password must have at least one uppercase letter" })
    .refine((p) => /[a-z]/.test(p), { message: "Password must have at least one lowercase letter" })
    .refine((p) => /[0-9]/.test(p), { message: "Password must have at least one number" })
    .refine((p) => /[!@#$%^&*]/.test(p), { message: "Password must have at least one special character (!@#$%^&*)" });

const registerSchema = z.object({
    firstName: z.string().min(2, "First name too short").max(50).trim(),
    lastName: z.string().min(2, "Last name too short").max(50).trim(),
    email: z.string().email("Invalid email address").trim(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
);
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password")
}).refine(
    (data) => data.newPassword === data.confirmPassword,
    {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    }
).refine(
    (data) => data.currentPassword !== data.newPassword,
    { message: "New password must be different from current", path: ["newPassword"] }
);

const loginSchema = z.object({
    email: z.string().email("Invalid email address").trim(),
    password: z.string().min(1, "Password is required")
});

const profileUpdateSchema = z.object({
    bvn: z.string().length(11, "BVN must be exactly 11 digits"), // <--- Add this
    phone: z.string().min(11, "Invalid phone number").max(11, "Invalid phone number"),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    gender: z.enum(["male", "female", "other"]),
    address: z.object({
        street: z.string().min(2).trim(),
        city: z.string().min(2).trim(),
        state: z.string().min(2).trim(),
        country: z.string().default("Nigeria"),
        postalCode: z.string().optional()
    }),
    nextOfKin: z.object({
        name: z.string().min(2).trim(),
        phone: z.string().min(11).max(11),
        relationship: z.string().min(2).trim(),
        address: z.string().optional()
    })
});

module.exports = { registerSchema, loginSchema, changePasswordSchema, passwordSchema , profileUpdateSchema};
