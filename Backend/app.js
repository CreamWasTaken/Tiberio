require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // import DB
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const checkUpRoutes = require("./routes/checkUpRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//routes
app.get("/", (req, res) => {
  res.send("Teberio API is running");
});
// user
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/checkups", checkUpRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/categories", categoryRoutes);

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
      console.log(`🚀 Tiberio API is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err.message);
    process.exit(1); // Stop app if DB connection fails
  }
})();




//to do

//make delete patient (soft delete)

//make backend query to get all checkups base on user selected(edit,delete)

//change db for inventory category,subcategory,items table 

//make pricelist screen
//product automatically adds to inventory when new items are added (form of inventory and adding price list is the same)

//make description of the products unique(no the same, make it except for Frames)

//Progression
//1. Edit Delete for patients
//2 Edit Delete for Checkups
//3. price module
//4. inventory module
