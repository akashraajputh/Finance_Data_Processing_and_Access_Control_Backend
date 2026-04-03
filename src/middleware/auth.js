const { getUserById, verifyToken } = require('../models/userModel');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await getUserById(decoded.id);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'User not found or inactive' });
  }

  req.user = user;
  next();
}

function requiresRole(roles = []) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated access' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }

    next();
  };
}

module.exports = { authMiddleware, requiresRole };
