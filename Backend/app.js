require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db"); // import DB
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const checkUpRoutes = require("./routes/checkUpRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const { testSocketEvent } = require("./test-socket-endpoint");

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/checkups", checkUpRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);

// Test endpoint for Socket.IO
app.get("/api/test-socket", testSocketEvent);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Join room for specific updates
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`🔌 Client ${socket.id} joined room: ${room}`);
    console.log(`🔌 Total clients in room ${room}:`, io.sockets.adapter.rooms.get(room)?.size || 0);
  });

  // Leave room
  socket.on("leave-room", (room) => {
    socket.leave(room);
    console.log(`🔌 Client ${socket.id} left room: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
  
  socket.on("test-connection", (data) => {
    console.log("🔌 Test connection received from client:", socket.id, data);
  });
});

// Make io available globally for use in routes
app.set("io", io);

// Error handling middleware
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

    server.listen(PORT, () => {
      console.log(`🚀 Tiberio API is running on http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO server is ready for real-time updates`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err.message);
    process.exit(1); // Stop app if DB connection fails
  }
})();

//to do

//fix when adding transaction it says unkown need to refresh to see full data

