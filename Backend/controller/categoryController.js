require("dotenv").config();
const db = require("../config/db");

// Helper function to emit Socket.IO events
const emitSocketEvent = (req, event, data) => {
  const io = req.app.get('io');
  if (io) {
    console.log(`🔌 Emitting Socket.IO event: ${event}`, data);
    io.to(event).emit(event, data);
  } else {
    console.log(`❌ Socket.IO not available for event: ${event}`);
  }
};


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
        description, code, service, price, pc_price, pc_cost, cost, subcategory_id, supplier_id,
        index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
        steps, addFr, addTo, modality, set, bc,
        volume, set_cost,
        stock, low_stock_threshold
    } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Create attributes object with all the additional fields
        const attributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service,
            stock: stock ?? null,
            low_stock_threshold: low_stock_threshold ?? null
        };
        
        const [result] = await conn.query(
            "INSERT INTO products (subcategory_id, supplier_id, code, description, pc_price, pc_cost, attributes) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [subcategory_id, supplier_id, code, description, pc_price, pc_cost, JSON.stringify(attributes)]
        );
        await conn.commit();
        
        // Emit Socket.IO events for item and inventory updates
        emitSocketEvent(req, 'item-updated', { type: 'added', itemId: result.insertId });
        if (supplier_id) {
          emitSocketEvent(req, 'inventory-updated', { type: 'added', itemId: result.insertId });
        }
        
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

// Inventory: list products that are in inventory (supplier_id not null)
exports.getInventoryItems = async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const [result] = await conn.query(
            `SELECT p.*, s.name AS supplier_name
             FROM products p
             LEFT JOIN suppliers s ON p.supplier_id = s.id
             WHERE p.is_deleted = 0 AND p.supplier_id IS NOT NULL`
        );

        const items = result.map(item => ({
            ...item,
            attributes: item.attributes ? JSON.parse(item.attributes) : {}
        }));

        res.status(200).json({ items });
    } catch (error) {
        res.status(500).json({ message: "Failed to get inventory items", error: error.message });
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

exports.updateItem = async (req, res) => {
    const {id} = req.params;
    const {
        description, code, service, price, pc_price, pc_cost, cost, subcategory_id, supplier_id,
        index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
        steps, addFr, addTo, modality, set, bc,
        volume, set_cost,
        stock, low_stock_threshold
    } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Check if this is a frame category (frames can have duplicate descriptions)
        const [categoryResult] = await conn.query(
            `SELECT pc.name as category_name 
             FROM price_subcategories ps 
             JOIN price_categories pc ON ps.category_id = pc.id 
             WHERE ps.id = ?`, 
            [subcategory_id]
        );
        
        const categoryName = categoryResult[0]?.category_name?.toLowerCase() || '';
        const isFrameCategory = categoryName.includes('frame');
        
        // If not a frame category, check for duplicate descriptions (excluding current item)
        if (!isFrameCategory) {
            const [duplicateResult] = await conn.query(
                "SELECT id FROM products WHERE description = ? AND id != ? AND is_deleted = 0",
                [description, id]
            );
            
            if (duplicateResult.length > 0) {
                await conn.rollback();
                return res.status(400).json({
                    message: "An item with this description already exists. Please use a different description.",
                    error: "DUPLICATE_DESCRIPTION"
                });
            }
        }
        
        // Create attributes object with all the additional fields
        const attributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service,
            stock: stock ?? null,
            low_stock_threshold: low_stock_threshold ?? null
        };
        
        const [result] = await conn.query(
            "UPDATE products SET description = ?, code = ?, pc_price = ?, pc_cost = ?, subcategory_id = ?, supplier_id = ?, attributes = ? WHERE id = ?", 
            [description, code, pc_price, pc_cost, subcategory_id, supplier_id, JSON.stringify(attributes), id]
        );
        await conn.commit();
        
        // Emit Socket.IO events for item and inventory updates
        emitSocketEvent(req, 'item-updated', { type: 'updated', itemId: id });
        if (supplier_id) {
          emitSocketEvent(req, 'inventory-updated', { type: 'updated', itemId: id });
        }
        
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
        
        // Emit Socket.IO events for item and inventory updates
        emitSocketEvent(req, 'item-updated', { type: 'deleted', itemId: id });
        emitSocketEvent(req, 'inventory-updated', { type: 'deleted', itemId: id });
        
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