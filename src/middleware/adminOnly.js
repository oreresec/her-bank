const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied — admins only" });
    }
    next();
};

module.exports = adminOnly;
