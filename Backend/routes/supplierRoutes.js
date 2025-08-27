const express = require("express");
const router = express.Router();
const supplierController = require("../controller/supplierController");
const {authenticateToken} = require("../middleware/authenticateToken");

router.post("/add-supplier", authenticateToken, supplierController.addSupplier);
router.get("/get-suppliers", authenticateToken, supplierController.getSuppliers);

router.put("/update-supplier/:id", authenticateToken, supplierController.updateSupplier);
router.delete("/delete-supplier/:id", authenticateToken, supplierController.deleteSupplier);

module.exports = router;