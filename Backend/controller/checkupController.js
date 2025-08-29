require("dotenv").config();
const db = require("../config/db");

exports.addCheckup = async (req, res) => {
  const userId = req.user?.id;
  const {
    patient_id,
    checkup_date,
    notes,
    diagnosis,
    binocular_pd,
    spectacle_prescription,
    contact_lens_prescription
  } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!patient_id) {
    return res.status(400).json({ error: "patient_id is required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [checkupResult] = await conn.query(
      "INSERT INTO checkups (user_id, patient_id, checkup_date, notes, diagnosis, binocular_pd) VALUES (?,?,?,?,?,?)",
      [userId, patient_id, checkup_date || null, notes || null, diagnosis || null, binocular_pd || null]
    );

    const checkupId = checkupResult.insertId;

    if (spectacle_prescription && typeof spectacle_prescription === "object") {
      const sp = spectacle_prescription;
      await conn.query(
        `INSERT INTO spectacle_prescriptions 
          (checkupId, sphereRight, cylinderRight, axisRight, additionRight, visualAcuityRight, monocularPdRight,
           sphereLeft, cylinderLeft, axisLeft, additionLeft, visualAcuityLeft, monocularPdLeft)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          checkupId,
          sp.sphereRight ?? null,
          sp.cylinderRight ?? null,
          sp.axisRight ?? null,
          sp.additionRight ?? null,
          sp.visualAcuityRight ?? null,
          sp.monocularPdRight ?? null,
          sp.sphereLeft ?? null,
          sp.cylinderLeft ?? null,
          sp.axisLeft ?? null,
          sp.additionLeft ?? null,
          sp.visualAcuityLeft ?? null,
          sp.monocularPdLeft ?? null
        ]
      );
    }

    if (contact_lens_prescription && typeof contact_lens_prescription === "object") {
      const cp = contact_lens_prescription;
      await conn.query(
        `INSERT INTO contact_lens_prescriptions 
          (checkupId, sphereRight, sphereLeft, cylinderRight, cylinderLeft, axisRight, axisLeft, additionRight, additionLeft, baseCurveRight, baseCurveLeft, diameterRight, diameterLeft)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          checkupId,
          cp.sphereRight ?? null,
          cp.sphereLeft ?? null,
          cp.cylinderRight ?? null,
          cp.cylinderLeft ?? null,
          cp.axisRight ?? null,
          cp.axisLeft ?? null,
          cp.additionRight ?? null,
          cp.additionLeft ?? null,
          cp.baseCurveRight ?? null,
          cp.baseCurveLeft ?? null,
          cp.diameterRight ?? null,
          cp.diameterLeft ?? null
        ]
      );
    }

    await conn.commit();
    res.status(201).json({
      message: "Checkup created",
      checkup: {
        id: checkupId,
        user_id: userId,
        patient_id,
        checkup_date: checkup_date || null,
        notes: notes || null,
        diagnosis: diagnosis || null,
        binocular_pd: binocular_pd || null
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error("Error creating checkup:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    conn.release();
  }
};

exports.getPatientCheckups = async (req, res) => {
  const { patientId } = req.params;
  if (!patientId) {
    return res.status(400).json({ error: "patientId is required" });
  }
  try {
    const [rows] = await db.query(
      `SELECT c.*, CONCAT(u.first_name,' ',u.last_name) AS created_by_name
       FROM checkups c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.patient_id = ? AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
       ORDER BY c.created_at DESC`,
      [patientId]
    );
    if (rows.length === 0) {
      return res.status(200).json([]);
    }

    const checkupIds = rows.map(r => r.id);
    const placeholders = checkupIds.map(() => '?').join(',');

    const [spectacles] = await db.query(
      `SELECT * FROM spectacle_prescriptions WHERE checkupId IN (${placeholders})`,
      checkupIds
    );
    const [contacts] = await db.query(
      `SELECT * FROM contact_lens_prescriptions WHERE checkupId IN (${placeholders})`,
      checkupIds
    );

    const checkupIdToSpectacle = new Map();
    for (const sp of spectacles) {
      checkupIdToSpectacle.set(sp.checkupId, sp);
    }
    const checkupIdToContact = new Map();
    for (const cp of contacts) {
      checkupIdToContact.set(cp.checkupId, cp);
    }

    const enriched = rows.map(r => ({
      ...r,
      spectacle_prescription: checkupIdToSpectacle.get(r.id) || null,
      contact_lens_prescription: checkupIdToContact.get(r.id) || null
    }));

    res.status(200).json(enriched);
  } catch (err) {
    console.error("Error fetching checkups:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Total count of all checkups
exports.getTotalCheckupsCount = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS count FROM checkups WHERE is_deleted = 0");
    const count = rows?.[0]?.count ?? 0;
    res.status(200).json({ count });
  } catch (err) {
    console.error("Error fetching total checkups count:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete checkup (soft delete by setting is_deleted to 1)
exports.deleteCheckup = async (req, res) => {
  const { checkupId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!checkupId) {
    return res.status(400).json({ error: "checkupId is required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE checkups SET is_deleted = 1 WHERE id = ?",
      [checkupId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Checkup not found" });
    }

    res.status(200).json({ message: "Checkup deleted successfully" });
  } catch (err) {
    console.error("Error deleting checkup:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


