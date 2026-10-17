const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (req.user.role !== roles) {
            return res.status(403).json({
                message: "Access denied. You do not have permission to perform this action."
            });
        }
        next();
    };
};

module.exports = authorizeRoles;    