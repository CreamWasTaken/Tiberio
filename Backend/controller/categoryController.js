require("dotenv").config();
const db = require("../config/db");

// Helper function to emit Socket.IO events
const emitSocketEvent = (req, event, data) => {
  const io = req.app.get('io');
  if (io) {
    console.log(`🔌 Emitting Socket.IO event: ${event}`, data);
    console.log(`🔌 Emitting to room: ${event}`);
    io.to(event).emit(event, data);
    console.log(`🔌 Event emitted successfully`);
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
        
        // Create attributes object with all the additional fields (excluding stock and low_stock_threshold)
        const attributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service
        };
        
        const [result] = await conn.query(
            "INSERT INTO products (subcategory_id, supplier_id, code, description, pc_price, pc_cost, attributes, stock, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [subcategory_id, supplier_id, code, description, pc_price, pc_cost, JSON.stringify(attributes), stock ?? 0, low_stock_threshold ?? 5]
        );
        await conn.commit();
        
        // Fetch the newly created item data for socket emission
        const [newItemResult] = await conn.query(`
            SELECT p.*, s.name as supplier_name, 
                   JSON_UNQUOTE(p.attributes) as attributes_json
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ? AND p.is_deleted = 0
        `, [result.insertId]);
        
        if (newItemResult.length > 0) {
            const newItem = newItemResult[0];
            // Parse attributes JSON
            if (newItem.attributes_json) {
                newItem.attributes = JSON.parse(newItem.attributes_json);
            }
            delete newItem.attributes_json;
            
            // Emit Socket.IO events with complete item data
            emitSocketEvent(req, 'item-updated', { type: 'added', item: newItem });
            
            // If item has a supplier (meaning it's added to inventory), emit inventory event
            if (supplier_id) {
                emitSocketEvent(req, 'inventory-updated', { type: 'added', item: newItem });
            }
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
        
        // Parse attributes JSON for each item and include stock from actual columns
        const items = result.map(item => {
            const attributes = item.attributes ? JSON.parse(item.attributes) : {};
            return {
                ...item,
                attributes: {
                    ...attributes,
                    stock: item.stock, // Use the actual stock column
                    low_stock_threshold: item.low_stock_threshold // Use the actual low_stock_threshold column
                }
            };
        });
        
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

        const items = result.map(item => {
            const attributes = item.attributes ? JSON.parse(item.attributes) : {};
            return {
                ...item,
                attributes: {
                    ...attributes,
                    stock: item.stock, // Use the actual stock column
                    low_stock_threshold: item.low_stock_threshold // Use the actual low_stock_threshold column
                }
            };
        });

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
        
        // Create attributes object with all the additional fields (excluding stock and low_stock_threshold)
        const attributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service
        };
        
        const [result] = await conn.query(
            "UPDATE products SET description = ?, code = ?, pc_price = ?, pc_cost = ?, subcategory_id = ?, supplier_id = ?, attributes = ?, stock = ?, low_stock_threshold = ? WHERE id = ?", 
            [description, code, pc_price, pc_cost, subcategory_id, supplier_id, JSON.stringify(attributes), stock ?? 0, low_stock_threshold ?? 5, id]
        );
        await conn.commit();
        
        // Fetch the updated item data for socket emission
        const [updatedItemResult] = await conn.query(`
            SELECT p.*, s.name as supplier_name, 
                   JSON_UNQUOTE(p.attributes) as attributes_json
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ? AND p.is_deleted = 0
        `, [id]);
        
        if (updatedItemResult.length > 0) {
            const updatedItem = updatedItemResult[0];
            // Parse attributes JSON
            if (updatedItem.attributes_json) {
                updatedItem.attributes = JSON.parse(updatedItem.attributes_json);
            }
            delete updatedItem.attributes_json;
            
            // Emit Socket.IO events with complete item data
            emitSocketEvent(req, 'item-updated', { type: 'updated', item: updatedItem });
            
            // Always emit inventory event for updates, with appropriate type
            if (supplier_id) {
                // Item is being added/kept in inventory
                console.log(`🔌 Emitting inventory-updated event: type=updated, item=${updatedItem.id}, supplier_id=${supplier_id}`);
                emitSocketEvent(req, 'inventory-updated', { type: 'updated', item: updatedItem });
            } else {
                // Item is being removed from inventory (supplier_id set to null)
                console.log(`🔌 Emitting inventory-updated event: type=deleted, item=${updatedItem.id}, supplier_id=${supplier_id}`);
                emitSocketEvent(req, 'inventory-updated', { type: 'deleted', item: updatedItem });
            }
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
        
        // Fetch the item data before deletion for socket emission
        const [itemToDelete] = await conn.query(`
            SELECT p.*, s.name as supplier_name, 
                   JSON_UNQUOTE(p.attributes) as attributes_json
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.id = ? AND p.is_deleted = 0
        `, [id]);
        
        const [result] = await conn.query("UPDATE products SET is_deleted = 1 WHERE id = ?", [id]);
        await conn.commit();
        
        if (itemToDelete.length > 0) {
            const deletedItem = itemToDelete[0];
            // Parse attributes JSON
            if (deletedItem.attributes_json) {
                deletedItem.attributes = JSON.parse(deletedItem.attributes_json);
            }
            delete deletedItem.attributes_json;
            
            // Emit Socket.IO events with complete item data
            emitSocketEvent(req, 'item-updated', { type: 'deleted', item: deletedItem });
            
            // If item had a supplier (meaning it was in inventory), emit inventory event
            if (deletedItem.supplier_id) {
                emitSocketEvent(req, 'inventory-updated', { type: 'deleted', item: deletedItem });
            }
        }
        
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