require("dotenv").config();
const db = require("../config/db");

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
        // Calculate age from birthdate
        const birthDate = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const query = "INSERT INTO patients (first_name, middle_name, last_name, sex, birthdate, age, contact_number, telephone_number, senior_number,address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)";
        const [result] = await db.query(query, [first_name, middle_name, last_name, sex, birthdate, age, contact_number, telephone_number, senior_number,address]);

        res.status(201).json({
            message: "Patient created successfully",
            patient: {
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
                address
            }
        });
    } catch (err) {
        console.error("Error inserting patient:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getPatients = async (req, res) => {
    try {
        const query = "SELECT * FROM patients";
        const [result] = await db.query(query);
        res.status(200).json(result);
    } catch (err) {
        console.error("Error fetching patients:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};