const jwt = require("jsonwebtoken");

/**
 * Verifies the Bearer JWT on the request and attaches { userId, email, role }
 * to req.user. This is the single source of truth for identity + role —
 * the frontend must never be trusted to self-report a role.
 */
function userFromPayload(payload) {
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    ...(payload.guest ? { guest: true, name: payload.name, workspaceId: payload.workspaceId } : {}),
  };
}

function authenticate(allowGuest) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing authentication token" });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.guest && !allowGuest) {
        return res.status(403).json({ message: "Guests can only use the shared workspace" });
      }
      req.user = userFromPayload(payload);
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

const requireAuth = authenticate(false);
// Only for workspace-scoped routes: also accepts a guest token minted from a share link.
const requireAuthOrGuest = authenticate(true);

/**
 * Restricts a route to one or more roles. Must run after requireAuth.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}

/**
 * Optional auth: attaches req.user if a valid token is present, but does not
 * reject the request if it's missing/invalid. Used for endpoints like
 * "look up an interview by code" that candidates may hit before/without login.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.guest) req.user = userFromPayload(payload);
  } catch (err) {
    // ignore invalid token for optional auth
  }
  next();
}

module.exports = { requireAuth, requireAuthOrGuest, requireRole, optionalAuth };
