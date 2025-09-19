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
const { testSocketEvent, testSpecificEvent, getSocketStatus } = require("./test-socket-endpoint");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for network access
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: "*", 
  credentials: true
}));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/checkups", checkUpRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/orders", orderRoutes);

// Socket.IO Test endpoints
app.get("/api/test-socket", testSocketEvent);
app.post("/api/test-socket/event", testSpecificEvent);
app.get("/api/socket-status", getSocketStatus);

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


app.set("io", io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;


(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected!");
    conn.release();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Tiberio API is running on http://0.0.0.0:${PORT}`);
      console.log(`🔌 Socket.IO server is ready for real-time updates`);
      console.log(`🌐 Server accessible from network on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err.message);
    process.exit(1); // Stop app if DB connection fails
  }
})();

//to do


// fix fulfill socket

//automatic date today on add check up

// add specs on cart 

// search on specs cart

// edit on patient name both admin employee

// hide cmd when opening

// search on items base in specs

