require("dotenv").config();
const db = require("../config/db");


exports.addCategory = async (req, res) => {
    const {name, description} = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("INSERT INTO price_categories (name, description) VALUES (?, ?)", [name, description]);
        await conn.commit();
        res.status(201).json({message: "Category added successfully", category: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to add category", error: error.message});
    }
}

exports.getCategory = async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const [result] = await conn.query("SELECT * FROM price_categories WHERE is_deleted = 0");
        res.status(200).json({categories: result});
    } catch (error) {
        res.status(500).json({message: "Failed to get categories", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.updateCategory = async (req, res) => {
    const {id} = req.params;
    const {name, description} = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("UPDATE price_categories SET name = ?, description = ? WHERE id = ?", [name, description, id]);
        await conn.commit();
        res.status(200).json({message: "Category updated successfully", category: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to update category", error: error.message});
    }
}

exports.deleteCategory = async (req, res) => {  
    const {id} = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("UPDATE price_categories SET is_deleted = 1 WHERE id = ?", [id]);
        await conn.commit();
        res.status(200).json({message: "Category deleted successfully", category: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to delete category", error: error.message});
    }
}