const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: "Access token is missing or invalid",
        code: "TOKEN_MISSING"
      });
    }

    // Verify the token
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    
    // Add the payload to the request object
    req.payload = payload;
    
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        message: "Access token has expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ 
        message: "Access token is invalid",
        code: "TOKEN_INVALID"
      });
    }
    
    return res.status(401).json({ 
      message: "Authentication failed",
      code: "AUTH_FAILED"
    });
  }
};

module.exports = { isAuthenticated };