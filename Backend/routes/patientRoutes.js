const express = require("express");
const router = express.Router();
const patientController = require("../controller/patientController");
const {authenticateToken} = require("../middleware/authenticateToken");

router.post("/add-patient", patientController.addPatient);

module.exports = router;
