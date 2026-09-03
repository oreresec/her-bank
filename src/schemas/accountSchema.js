const { z } = require('zod');

const accountSchema = z.object({
    kycType: z.enum(["bvn", "nin"], {message: "kycType must be bvn or nin"}),
    kycID: z.string().length(11, "Must be exactly 11 digits").regex(/^\d{11}$/, "Must contain only numbers"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),

})
module.exports = {accountSchema};
