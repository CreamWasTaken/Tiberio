const express = require("express");
const router = express.Router();
const checkupController = require("../controller/checkupController");
const { authenticateToken } = require("../middleware/authenticateToken");

// Add checkup for a specific patient
router.post("/patients/:patientId/checkups", authenticateToken, (req, res, next) => {
  req.body.patient_id = Number(req.params.patientId);
  return checkupController.addCheckup(req, res, next);
});

// Get all checkups for a specific patient
router.get("/patients/:patientId/checkups", authenticateToken, checkupController.getPatientCheckups);

// Get total count of all checkups
router.get("/count", authenticateToken, checkupController.getTotalCheckupsCount);

// Delete a specific checkup
router.delete("/checkups/:checkupId", authenticateToken, checkupController.deleteCheckup);

module.exports = router;
