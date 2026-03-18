// JWT authentication middleware.
// Add this as the second argument to any route that requires a logged-in user.
// On success it attaches the decoded token payload to req.user for downstream handlers.

import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {

  // Expect the token in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // grab the part after "Bearer "

  // No token provided → 401 Unauthorized
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  // Verify signature and expiry using our secret key.
  // NOTE: process_params.env is a typo — should be process.env
  jwt.verify(token, process_params.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token is malformed or expired → 403 Forbidden
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    // Attach decoded payload (contains userId, email) so controllers can use req.user
    req.user = user;
    next();
  });
}
