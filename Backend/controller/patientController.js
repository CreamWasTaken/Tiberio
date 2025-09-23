require("dotenv").config();
const db = require("../config/db");

// Helper function to emit Socket.IO events
const emitSocketEvent = (req, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(event).emit(event, data);
  }
};

// Helper function to check for duplicate patients
const checkDuplicatePatient = async (first_name, last_name, birthdate) => {
    try {
        const query = `
            SELECT id, first_name, last_name, birthdate, contact_number, telephone_number, address
            FROM patients 
            WHERE first_name = ? AND last_name = ? AND birthdate = ?
        `;
        const [result] = await db.query(query, [first_name, last_name, birthdate]);
        return result.length > 0 ? result[0] : null;
    } catch (err) {
        console.error("Error checking for duplicate patient:", err);
        return null;
    }
};

exports.addPatient = async (req, res) => {
    const { first_name, last_name, middle_name, sex, birthdate, contact_number, telephone_number, senior_number,address } = req.body;

    // Validation: Check if required fields are empty
    if (!first_name || !last_name || !sex || !birthdate) {
        return res.status(400).json({ 
            error: "Required fields are missing", 
            message: "Please provide first_name, last_name, sex, and birthdate" 
        });
    }

    // Check if any required field is empty string
    if (first_name.trim() === '' || last_name.trim() === '' || sex.trim() === '' || birthdate.trim() === '') {
        return res.status(400).json({ 
            error: "Required fields cannot be empty", 
            message: "Please provide valid values for first_name, last_name, sex, and birthdate" 
        });
    }

    try {
        // Check for duplicate patient before creating
        const duplicatePatient = await checkDuplicatePatient(first_name, last_name, birthdate);
        if (duplicatePatient) {
            return res.status(409).json({
                error: "Potential duplicate patient found",
                message: "A patient with the same name and birthdate already exists",
                duplicatePatient: {
                    id: duplicatePatient.id,
                    name: `${duplicatePatient.first_name} ${duplicatePatient.last_name}`,
                    birthdate: duplicatePatient.birthdate,
                    contact: duplicatePatient.contact_number || duplicatePatient.telephone_number,
                    address: duplicatePatient.address
                }
            });
        }
        // Calculate age from birthdate
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const userId = req.user?.id || null;
        const query = "INSERT INTO patients (first_name, middle_name, last_name, sex, birthdate, age, contact_number, telephone_number, senior_number,address, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await db.query(query, [first_name, middle_name, last_name, sex, birthdate, age, contact_number, telephone_number, senior_number, address, userId]);

        const newPatient = {
            id: result.insertId,
            first_name,
            middle_name,
            last_name,
            sex,
            birthdate,
            age,
            contact_number,
            telephone_number,
            senior_number,
            address,
            user_id: userId
        };

        // Emit Socket.IO event for patient update
        emitSocketEvent(req, 'patient-updated', { type: 'added', patient: newPatient });

        res.status(201).json({
            message: "Patient created successfully",
            patient: newPatient
        });
    } catch (err) {
        console.error("Error inserting patient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getPatients = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*, 
                CONCAT(u.first_name, ' ', u.last_name) AS created_by_name
            FROM patients p
            LEFT JOIN users u ON p.user_id = u.id
        `;
        const [result] = await db.query(query);
        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching patients:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updatePatient = async (req, res) => {
    const { patientId } = req.params;
    const { first_name, last_name, middle_name, sex, birthdate, contact_number, telephone_number, senior_number, address } = req.body;

    // Validation: Check if required fields are empty
    if (!first_name || !last_name || !sex || !birthdate) {
        return res.status(400).json({ 
            error: "Required fields are missing", 
            message: "Please provide first_name, last_name, sex, and birthdate" 
        });
    }

    // Check if any required field is empty string
    if (first_name.trim() === '' || last_name.trim() === '' || sex.trim() === '' || birthdate.trim() === '') {
        return res.status(400).json({ 
            error: "Required fields cannot be empty", 
            message: "Please provide valid values for first_name, last_name, sex, and birthdate" 
        });
    }

    if (!patientId) {
        return res.status(400).json({ error: "Patient ID is required" });
    }

    try {
        // Check if patient exists
        const [existingPatient] = await db.query(
            "SELECT * FROM patients WHERE id = ?",
            [patientId]
        );

        if (existingPatient.length === 0) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Check for duplicate patient (excluding current patient)
        const duplicatePatient = await checkDuplicatePatient(first_name, last_name, birthdate);
        if (duplicatePatient && duplicatePatient.id !== parseInt(patientId)) {
            return res.status(409).json({
                error: "Potential duplicate patient found",
                message: "A patient with the same name and birthdate already exists",
                duplicatePatient: {
                    id: duplicatePatient.id,
                    name: `${duplicatePatient.first_name} ${duplicatePatient.last_name}`,
                    birthdate: duplicatePatient.birthdate,
                    contact: duplicatePatient.contact_number || duplicatePatient.telephone_number,
                    address: duplicatePatient.address
                }
            });
        }

        // Calculate age from birthdate
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const query = `
            UPDATE patients 
            SET first_name = ?, middle_name = ?, last_name = ?, sex = ?, birthdate = ?, age = ?, 
                contact_number = ?, telephone_number = ?, senior_number = ?, address = ?
            WHERE id = ?
        `;
        
        const [result] = await db.query(query, [
            first_name, middle_name, last_name, sex, birthdate, age, 
            contact_number, telephone_number, senior_number, address, patientId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const updatedPatient = {
            id: parseInt(patientId),
            first_name,
            middle_name,
            last_name,
            sex,
            birthdate,
            age,
            contact_number,
            telephone_number,
            senior_number,
            address,
            user_id: existingPatient[0].user_id
        };

        // Emit Socket.IO event for patient update
        emitSocketEvent(req, 'patient-updated', { type: 'updated', patient: updatedPatient });

        res.status(200).json({
            message: "Patient updated successfully",
            patient: updatedPatient
        });
    } catch (err) {
        console.error("Error updating patient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.checkDuplicatePatient = async (req, res) => {
    const { first_name, last_name, birthdate } = req.query;

    // Validation: Check if required fields are provided
    if (!first_name || !last_name || !birthdate) {
        return res.status(400).json({ 
            error: "Required fields are missing", 
            message: "Please provide first_name, last_name, and birthdate" 
        });
    }

    try {
        const duplicatePatient = await checkDuplicatePatient(first_name, last_name, birthdate);
        
        if (duplicatePatient) {
            return res.status(200).json({
                isDuplicate: true,
                duplicatePatient: {
                    id: duplicatePatient.id,
                    name: `${duplicatePatient.first_name} ${duplicatePatient.last_name}`,
                    birthdate: duplicatePatient.birthdate,
                    contact: duplicatePatient.contact_number || duplicatePatient.telephone_number,
                    address: duplicatePatient.address
                }
            });
        } else {
            return res.status(200).json({
                isDuplicate: false
            });
        }
    } catch (err) {
        console.error("Error checking for duplicate patient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deletePatient = async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (!patientId) {
        return res.status(400).json({ error: "patientId is required" });
    }

    try {
        // Check if patient exists and belongs to the user (optional security check)
        const [existingPatient] = await db.query(
            "SELECT * FROM patients WHERE id = ?",
            [patientId]
        );

        if (existingPatient.length === 0) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Delete the patient
        const [result] = await db.query(
            "DELETE FROM patients WHERE id = ?",
            [patientId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Emit Socket.IO event for patient deletion
        emitSocketEvent(req, 'patient-updated', { 
            type: 'deleted', 
            patientId: patientId 
        });

        res.status(200).json({ 
            message: "Patient deleted successfully",
            patientId: patientId
        });
    } catch (err) {
        console.error("Error deleting patient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};