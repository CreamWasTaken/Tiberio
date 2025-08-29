const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const { authenticateToken } = require("../middleware/authenticateToken");

// Category routes
router.post("/add-category", authenticateToken, categoryController.addCategory);
router.get("/get-category", authenticateToken, categoryController.getCategory);
router.put("/update-category/:id", authenticateToken, categoryController.updateCategory);
router.delete("/delete-category/:id", authenticateToken, categoryController.deleteCategory);

// Subcategory routes
router.post("/add-subcategory", authenticateToken, categoryController.addSubcategory);
router.get("/get-subcategories/:categoryId", authenticateToken, categoryController.getSubcategories);
router.put("/update-subcategory/:id", authenticateToken, categoryController.updateSubcategory);
router.delete("/delete-subcategory/:id", authenticateToken, categoryController.deleteSubcategory);

// Item routes
router.post("/add-item", authenticateToken, categoryController.addItem);
router.get("/get-items/:subcategoryId", authenticateToken, categoryController.getItems);
router.get("/get-inventory-items", authenticateToken, categoryController.getInventoryItems);
router.put("/update-item/:id", authenticateToken, categoryController.updateItem);
router.delete("/delete-item/:id", authenticateToken, categoryController.deleteItem);

module.exports = router;



