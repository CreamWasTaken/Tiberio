const express = require("express");
const router = express.Router();
const patientController = require("../controller/patientController");
const {authenticateToken} = require("../middleware/authenticateToken");

router.post("/add-patient", authenticateToken, patientController.addPatient);
router.put("/update-patient/:patientId", authenticateToken, patientController.updatePatient);
router.get("/get-patients", patientController.getPatients);
router.get("/check-duplicate", patientController.checkDuplicatePatient);

module.exports = router;
