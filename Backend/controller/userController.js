
const db = require("../config/db");
const bcrypt = require("bcrypt");  
const saltRounds = 10;


exports.addUser = async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "username, password, and role are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert into DB
    const query = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    const [result] = await db.query(query, [username, hashedPassword, role]);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: result.insertId,
        username,
        role
      }
    });
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};