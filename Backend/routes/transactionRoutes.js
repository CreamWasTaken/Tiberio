const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transactionController");
const { authenticateToken } = require("../middleware/authenticateToken");

// Transaction routes
router.post("/add-transaction",transactionController.createTransaction);
router.get("/get-transactions",transactionController.getAllTransactions);
router.get("/get-transaction/:id", transactionController.getTransactionById);
router.put("/update-transaction/:id",transactionController.updateTransaction);
router.delete("/delete-transaction/:id",transactionController.deleteTransaction);

// Transaction status management
router.patch("/fulfill-transaction/:id", authenticateToken, transactionController.fulfillTransaction);
router.patch("/cancel-transaction/:id", authenticateToken, transactionController.cancelTransaction);

// Individual item management
router.patch("/fulfill-item/:itemId", authenticateToken, transactionController.fulfillTransactionItem);

// Get transaction items
router.get("/get-transaction-items/:transactionId", authenticateToken, transactionController.getTransactionItems);

module.exports = router;