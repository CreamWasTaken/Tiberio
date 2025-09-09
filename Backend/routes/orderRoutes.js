const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const { authenticateToken } = require("../middleware/authenticateToken");

// Get all orders
router.get("/", authenticateToken, orderController.getOrders);

// Get order statistics
router.get("/stats", authenticateToken, orderController.getOrderStats);

// Get single order by ID
router.get("/:id", authenticateToken, orderController.getOrderById);

// Create new order
router.post("/", authenticateToken, orderController.createOrder);

// Update order
router.put("/:id", authenticateToken, orderController.updateOrder);

// Delete order
router.delete("/:id", authenticateToken, orderController.deleteOrder);

module.exports = router;