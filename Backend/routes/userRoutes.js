const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const {authenticateToken} = require("../middleware/authenticateToken");

router.post("/add-user", userController.addUser);
router.post("/login", userController.login);

router.get("/get-user-logs",authenticateToken,userController.getUserLogs);
router.get("/get-user",authenticateToken,userController.getAllUser);

router.put("/change-user-status/:id",authenticateToken,userController.changeUserStatus);
router.put("/change-password/:id",authenticateToken,userController.changePassword);


module.exports = router;