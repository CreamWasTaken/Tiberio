const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const { authenticateToken } = require("../middleware/authenticateToken");

router.post("/add-category", authenticateToken, categoryController.addCategory);
router.get("/get-category", authenticateToken, categoryController.getCategory);
router.put("/update-category/:id", authenticateToken, categoryController.updateCategory);
router.delete("/delete-category/:id", authenticateToken, categoryController.deleteCategory);

module.exports = router;



