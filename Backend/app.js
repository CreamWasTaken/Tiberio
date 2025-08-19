require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // import DB
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//routes
app.get("/", (req, res) => {
  res.send("Teberio API is running");
});

// user routes
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;

// Check DB connection before starting server
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected!");
    conn.release();

    app.listen(PORT, () => {
      console.log(`🚀 Teberio API is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err.message);
    process.exit(1); // Stop app if DB connection fails
  }
})();
