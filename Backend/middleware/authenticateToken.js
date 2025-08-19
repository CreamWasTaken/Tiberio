require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });

    req.user = user; 
    next();
  });
};



// Example GET request with Bearer token using axios

// axios.get("http://localhost:3000/profile", {
//   headers: {
//     Authorization: `Bearer ${token}` // <-- Add token here
//   }
// })
// .then(response => {
//   console.log("Profile data:", response.data);
// })
// .catch(error => {
//   console.error("Error fetching profile:", error.response?.data || error.message);
// });