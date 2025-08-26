const express = require("express");
const router = express.Router();
const patientController = require("../controller/patientController");
const {authenticateToken} = require("../middleware/authenticateToken");
const checkupController = require("../controller/checkupController");

router.post("/add-patient", authenticateToken, patientController.addPatient);
router.get("/get-patients", patientController.getPatients);

// checkups
router.post("/patients/:patientId/checkups", authenticateToken, (req, res, next) => {
  req.body.patient_id = Number(req.params.patientId);
  return checkupController.addCheckup(req, res, next);
});
router.get("/patients/:patientId/checkups", authenticateToken, checkupController.getPatientCheckups);

// summary
router.get("/checkups/count", authenticateToken, checkupController.getTotalCheckupsCount);

module.exports = router;
