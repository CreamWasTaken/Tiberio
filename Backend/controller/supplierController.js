require("dotenv").config();
const db = require("../config/db");


exports.addSupplier = async (req, res) => {
    try {
        const { name, contact_person, contact_number, address, email } = req.body;

        const query = "INSERT INTO suppliers (name, contact_person, contact_number , address, email) VALUES (?, ?, ?, ?, ?)";
        const [result] = await db.query(query, [name, contact_person, contact_number, address, email]);

        res.status(201).json({ message: "Supplier added successfully" });
    } catch (err) {
        console.error("Error adding supplier:", err);
        res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.getSuppliers = async (req, res) => {
    try {
      const [rows] = await db.query("SELECT * FROM suppliers WHERE is_deleted = 0 OR is_deleted IS NULL");
      res.status(200).json(rows);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.updateSupplier = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, contact_person, contact_number, address, email } = req.body;

      const query = "UPDATE suppliers SET name = ?, contact_person = ?, contact_number = ?, address = ?, email = ? WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)";
      const [result] = await db.query(query, [name, contact_person, contact_number, address, email, id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Supplier not found or has been deleted" });
      }

      res.status(200).json({ message: "Supplier updated successfully" });
    } catch (err) {
      console.error("Error updating supplier:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.deleteSupplier = async (req, res) => {
    try {
      const { id } = req.params;

      const query = "UPDATE suppliers SET is_deleted = 1 WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)";
      const [result] = await db.query(query, [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Supplier not found or already deleted" });
      }

      res.status(200).json({ message: "Supplier deleted successfully" });
    } catch (err) {
      console.error("Error deleting supplier:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

