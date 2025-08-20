require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");  
const saltRounds = 10;

  
exports.addUser = async (req, res) => {
  const { username, password, first_name, last_name, type } = req.body;

  if (!username || !password || !first_name || !last_name || !type) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = "INSERT INTO users (username, password, first_name, last_name, type) VALUES (?, ?, ?, ?, ?)";
    const [result] = await db.query(query, [username, hashedPassword, first_name, last_name, type]);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: result.insertId,
        username,
        type
      }
    });
  } catch (err) {
    console.error("Error inserting user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username, password required" });
  }

  try {
   
    const query = "SELECT * FROM users WHERE username = ?";
    const [result] = await db.query(query, [username]);

    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    //query for login logs
    await db.query("INSERT INTO logs (user_id) VALUES (?)", [user.id]);

    res.status(200).json({
      message: "User Logged in successfully",
      token,  
      user: {
        id: user.id,
        username: user.username,
        name: user.first_name + " " + user.last_name,
        role: user.type
      }
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
