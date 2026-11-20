const User = require('../../shared/models/User');

const authorizeRoles = (...roles) => async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(userId).select('role');
    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }
    req.user.id = user._id.toString();
    req.user.role = user.role;

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: 'Access denied. You do not have permission to perform this action.'
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authorizeRoles;