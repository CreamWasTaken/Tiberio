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

// Update order status
router.patch("/:id/status", authenticateToken, orderController.updateOrderStatus);

// Update order item status
router.patch("/:orderId/items/:itemId/status", authenticateToken, orderController.updateOrderItemStatus);

// Return order item with quantity
router.patch("/:orderId/items/:itemId/return", authenticateToken, orderController.returnOrderItem);

// Delete order
router.delete("/:id", authenticateToken, orderController.deleteOrder);

module.exports = router;