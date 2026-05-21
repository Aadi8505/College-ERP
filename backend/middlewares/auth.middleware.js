const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/ApiResponse");

const auth = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.token;
    let token = cookieToken;

    if (!token) {
      const header = req.header("Authorization");
      if (header && header.startsWith("Bearer ")) {
        const headerToken = header.split(" ")[1];
        if (
          headerToken &&
          headerToken !== "null" &&
          headerToken !== "undefined"
        ) {
          token = headerToken;
        }
      }
    }

    if (!token) {
      return ApiResponse.unauthorized("Authentication token required").send(
        res,
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId) {
        return ApiResponse.unauthorized("Invalid token format").send(res);
      }

      req.userId = decoded.userId;
      req.token = token;
      next();
    } catch (jwtError) {
      console.error("JWT Error:", jwtError);
      return ApiResponse.unauthorized("Invalid or expired token").send(res);
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return ApiResponse.unauthorized("Authentication failed").send(res);
  }
};

module.exports = auth;
