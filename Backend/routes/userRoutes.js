const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const {authenticateToken} = require("../middleware/authenticateToken");

router.post("/add-user", userController.addUser);
router.post("/login", userController.login);

router.get("/get-user-logs",authenticateToken,userController.getUserLogs);
router.get("/get-user",authenticateToken,userController.getAllUser);


module.exports = router;