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

// Subcategory functions

exports.addSubcategory = async (req, res) => {
    const {name, description, category_id} = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("INSERT INTO price_subcategories (name, description, category_id) VALUES (?, ?, ?)", [name, description, category_id]);
        await conn.commit();
        res.status(201).json({message: "Subcategory added successfully", subcategory: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to add Subcategory", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.getSubcategories = async (req, res) => {
    const {categoryId} = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const [result] = await conn.query("SELECT * FROM price_subcategories WHERE category_id = ? AND is_deleted = 0", [categoryId]);
        res.status(200).json({subcategories: result});
    } catch (error) {
        res.status(500).json({message: "Failed to get subcategories", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.updateSubcategory = async (req, res) => {
    const {id} = req.params;
    const {name, description} = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("UPDATE price_subcategories SET name = ?, description = ? WHERE id = ?", [name, description, id]);
        await conn.commit();
        res.status(200).json({message: "Subcategory updated successfully", subcategory: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to update subcategory", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.deleteSubcategory = async (req, res) => {
    const {id} = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("UPDATE price_subcategories SET is_deleted = 1 WHERE id = ?", [id]);
        await conn.commit();
        res.status(200).json({message: "Subcategory deleted successfully", subcategory: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to delete subcategory", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

// Item functions

exports.addItem = async (req, res) => {
    const {
        description, code, service, price, cost, subcategory_id, supplier_id,
        index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
        steps, addFr, addTo, modality, set, bc,
        volume, set_cost
    } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Create attributes object with all the additional fields
        const attributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service
        };
        
        const [result] = await conn.query(
            "INSERT INTO products (subcategory_id, supplier_id, code, description, pc_price, pc_cost, attributes) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [subcategory_id, supplier_id, code, description, price, cost, JSON.stringify(attributes)]
        );
        await conn.commit();
        res.status(201).json({message: "Item added successfully", item: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to add item", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.getItems = async (req, res) => {
    const {subcategoryId} = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const [result] = await conn.query("SELECT * FROM products WHERE subcategory_id = ? AND is_deleted = 0", [subcategoryId]);
        
        // Parse attributes JSON for each item
        const items = result.map(item => ({
            ...item,
            attributes: item.attributes ? JSON.parse(item.attributes) : {}
        }));
        
        res.status(200).json({items: items});
    } catch (error) {
        res.status(500).json({message: "Failed to get items", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.updateItem = async (req, res) => {
    const {id} = req.params;
    const {
        description, code, service, price, cost, subcategory_id, supplier_id,
        index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
        steps, addFr, addTo, modality, set, bc,
        volume, set_cost
    } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Create attributes object with all the additional fields
        const attributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service
        };
        
        const [result] = await conn.query(
            "UPDATE products SET description = ?, code = ?, pc_price = ?, pc_cost = ?, subcategory_id = ?, supplier_id = ?, attributes = ? WHERE id = ?", 
            [description, code, price, cost, subcategory_id, supplier_id, JSON.stringify(attributes), id]
        );
        await conn.commit();
        res.status(200).json({message: "Item updated successfully", item: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to update item", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.deleteItem = async (req, res) => {
    const {id} = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query("UPDATE products SET is_deleted = 1 WHERE id = ?", [id]);
        await conn.commit();
        res.status(200).json({message: "Item deleted successfully", item: result});
    } catch (error) {
        await conn.rollback();
        res.status(500).json({message: "Failed to delete item", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}