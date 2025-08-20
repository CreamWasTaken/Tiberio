const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const {authenticateToken} = require("../middleware/authenticateToken");

router.post("/add-user", userController.addUser);
router.post("/login", userController.login);
router.get("/get-user-logs", userController.getUserLogs);

module.exports = router;