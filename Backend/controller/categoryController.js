require("dotenv").config();
const db = require("../config/db");

// Helper function to emit Socket.IO events
const emitSocketEvent = (req, event, data) => {
  const io = req.app.get('io');
  if (io) {
  
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
        stock, low_stock_threshold,
        sphere, cylinder, // Single Vision specific fields
        addToInventory // Check if adding to inventory
    } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Create attributes object for price_list (without inventory-specific fields)
        const priceListAttributes = {
            index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
            steps, addFr, addTo, modality, set, bc,
            volume, set_cost, service
        };
        
        // Insert into price_list table (supplier_id is required)
        if (!supplier_id) {
            await conn.rollback();
            return res.status(400).json({
                message: "Supplier is required for price list items",
                error: "MISSING_SUPPLIER"
            });
        }
        
        // Validate that supplier exists
        const [supplierCheck] = await conn.query(
            "SELECT id FROM suppliers WHERE id = ? AND is_deleted = 0",
            [supplier_id]
        );
        
        if (supplierCheck.length === 0) {
            await conn.rollback();
            return res.status(400).json({
                message: "Invalid supplier selected",
                error: "INVALID_SUPPLIER"
            });
        }
        
        const [result] = await conn.query(
            "INSERT INTO price_list (supplier_id, subcategory_id, attributes, description, pc_price, pc_cost, code) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [supplier_id, subcategory_id, JSON.stringify(priceListAttributes), description, pc_price, pc_cost, code]
        );
        
        const priceListId = result.insertId;
        
        // If adding to inventory, insert into products table
        if (addToInventory) {
            // Create attributes object for products table (inventory-specific fields)
            const productAttributes = {
                sphere, cylinder, diameter // Single Vision specific fields for products
            };
            
            const [productResult] = await conn.query(
                "INSERT INTO products (price_list_id, stock, low_stock_threshold, attributes) VALUES (?, ?, ?, ?)",
                [priceListId, stock || 0, low_stock_threshold || 5, JSON.stringify(productAttributes)]
            );
            
            // Inventory update will be emitted after we fetch the complete item data
        }
        
        await conn.commit();
        
        // Fetch the newly created item data for socket emission (same structure as getInventoryItems)
        const [newItemResult] = await conn.query(`
            SELECT pl.*, s.name as supplier_name, pc.name as category_name, ps.name as subcategory_name,
                   p.stock, p.low_stock_threshold, p.attributes as product_attributes,
                   JSON_UNQUOTE(pl.attributes) as attributes_json
            FROM price_list pl
            LEFT JOIN suppliers s ON pl.supplier_id = s.id
            LEFT JOIN price_subcategories ps ON pl.subcategory_id = ps.id
            LEFT JOIN price_categories pc ON ps.category_id = pc.id
            LEFT JOIN products p ON pl.id = p.price_list_id AND p.is_deleted = 0
            WHERE pl.id = ? AND pl.is_deleted = 0
        `, [priceListId]);
        
        if (newItemResult.length > 0) {
            const item = newItemResult[0];
            // Parse attributes JSON (same logic as getInventoryItems)
            const attributes = item.attributes_json ? JSON.parse(item.attributes_json) : {};
            const productAttributes = item.product_attributes ? JSON.parse(item.product_attributes) : {};
            
            const newItem = {
                ...item,
                attributes: {
                    ...attributes,
                    // Include product attributes (sphere, cylinder, diameter) in the main attributes
                    ...productAttributes,
                    stock: item.stock || 0,
                    low_stock_threshold: item.low_stock_threshold || 5
                }
            };
            
            // Clean up the temporary fields
            delete newItem.attributes_json;
            delete newItem.product_attributes;
            
            // Emit Socket.IO events with complete item data
            emitSocketEvent(req, 'item-updated', { type: 'added', item: newItem });
            
            // Also emit inventory update if this item was added to inventory
            if (addToInventory) {
                emitSocketEvent(req, 'inventory-updated', { type: 'added', item: newItem });
            }
        }
        
        res.status(201).json({message: "Item added successfully", item: result});
    } catch (error) {
        await conn.rollback();
        console.error('Error adding item:', error);
        console.error('Request body:', req.body);
        res.status(500).json({message: "Failed to add item", error: error.message});
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

// Bulk add products from pricelist template
exports.bulkAddProducts = async (req, res) => {
    const { pricelistId, products } = req.body;
    
    if (!pricelistId || !products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
            message: "Pricelist ID and products array are required",
            error: "MISSING_DATA"
        });
    }
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // Get the original pricelist item to use as template
        const [pricelistResult] = await conn.query(`
            SELECT pl.*, s.name as supplier_name, pc.name as category_name, ps.name as subcategory_name,
                   JSON_UNQUOTE(pl.attributes) as attributes_json
            FROM price_list pl
            LEFT JOIN suppliers s ON pl.supplier_id = s.id
            LEFT JOIN price_subcategories ps ON pl.subcategory_id = ps.id
            LEFT JOIN price_categories pc ON ps.category_id = pc.id
            WHERE pl.id = ? AND pl.is_deleted = 0
        `, [pricelistId]);
        
        if (pricelistResult.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                message: "Pricelist item not found",
                error: "PRICELIST_NOT_FOUND"
            });
        }
        
        const pricelistTemplate = pricelistResult[0];
        const createdProducts = [];
        
        // Process each product - only create products table entries
        for (const productData of products) {
            const {
                stock, lowStockThreshold, sphere, cylinder, diameter, index, tp
            } = productData;
            
            // Validate required fields
            if (stock === '' || lowStockThreshold === '') {
                await conn.rollback();
                return res.status(400).json({
                    message: `Missing required fields for product: stock and low stock threshold are required`,
                    error: "MISSING_REQUIRED_FIELDS"
                });
            }
            
            // Create product attributes (specific to this product)
            const productAttributes = {
                sphere: sphere || '',
                cylinder: cylinder || '',
                diameter: diameter || '',
                index: index || '',
                tp: tp || ''
            };
            
            // Insert into products table (inventory) - reference the existing price_list
            const [productResult] = await conn.query(
                "INSERT INTO products (price_list_id, stock, low_stock_threshold, attributes) VALUES (?, ?, ?, ?)",
                [
                    pricelistId, // Use the existing price_list ID
                    parseInt(stock),
                    parseInt(lowStockThreshold),
                    JSON.stringify(productAttributes)
                ]
            );
            
            // Get the complete item data for response
            const [newItemResult] = await conn.query(`
                SELECT pl.*, s.name as supplier_name, pc.name as category_name, ps.name as subcategory_name,
                       p.stock, p.low_stock_threshold, p.attributes as product_attributes,
                       JSON_UNQUOTE(pl.attributes) as attributes_json
                FROM price_list pl
                LEFT JOIN suppliers s ON pl.supplier_id = s.id
                LEFT JOIN price_subcategories ps ON pl.subcategory_id = ps.id
                LEFT JOIN price_categories pc ON ps.category_id = pc.id
                LEFT JOIN products p ON pl.id = p.price_list_id AND p.is_deleted = 0
                WHERE pl.id = ? AND p.id = ? AND pl.is_deleted = 0
            `, [pricelistId, productResult.insertId]);
            
            if (newItemResult.length > 0) {
                const item = newItemResult[0];
                const attributes = item.attributes_json ? JSON.parse(item.attributes_json) : {};
                const productAttrs = item.product_attributes ? JSON.parse(item.product_attributes) : {};
                
                const newItem = {
                    ...item,
                    attributes: {
                        ...attributes,
                        ...productAttrs,
                        stock: item.stock || 0,
                        low_stock_threshold: item.low_stock_threshold || 5
                    }
                };
                
                delete newItem.attributes_json;
                delete newItem.product_attributes;
                
                createdProducts.push(newItem);
            }
        }
        
        await conn.commit();
        
        // Emit Socket.IO events for each created product
        for (const product of createdProducts) {
            emitSocketEvent(req, 'item-updated', { type: 'added', item: product });
            emitSocketEvent(req, 'inventory-updated', { type: 'added', item: product });
        }
        
        res.status(201).json({
            message: `Successfully created ${createdProducts.length} products`,
            products: createdProducts,
            count: createdProducts.length
        });
        
    } catch (error) {
        await conn.rollback();
        console.error('Error bulk adding products:', error);
        res.status(500).json({
            message: "Failed to bulk add products",
            error: error.message
        });
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

exports.getItems = async (req, res) => {
    const {subcategoryId} = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const [result] = await conn.query(`
            SELECT pl.*, s.name as supplier_name,
                   COUNT(p.id) as product_count,
                   COALESCE(SUM(p.stock), 0) as total_stock
            FROM price_list pl
            LEFT JOIN suppliers s ON pl.supplier_id = s.id
            LEFT JOIN products p ON pl.id = p.price_list_id AND p.is_deleted = 0
            WHERE pl.subcategory_id = ? AND pl.is_deleted = 0
            GROUP BY pl.id
        `, [subcategoryId]);
        
        // Parse attributes JSON for each item
        const items = result.map(item => {
            const attributes = item.attributes ? JSON.parse(item.attributes) : {};
            
            return {
                ...item,
                attributes: {
                    ...attributes,
                    product_count: item.product_count || 0,
                    total_stock: item.total_stock || 0
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
            `SELECT pl.*, s.name AS supplier_name, pc.name AS category_name, ps.name AS subcategory_name,
                    p.stock, p.low_stock_threshold, p.attributes as product_attributes
             FROM price_list pl
             LEFT JOIN suppliers s ON pl.supplier_id = s.id
             LEFT JOIN price_subcategories ps ON pl.subcategory_id = ps.id
             LEFT JOIN price_categories pc ON ps.category_id = pc.id
             INNER JOIN products p ON pl.id = p.price_list_id AND p.is_deleted = 0
             WHERE pl.is_deleted = 0 AND pl.supplier_id IS NOT NULL`
        );

        const items = result.map(item => {
            const attributes = item.attributes ? JSON.parse(item.attributes) : {};
            const productAttributes = item.product_attributes ? JSON.parse(item.product_attributes) : {};
            
            return {
                ...item,
                attributes: {
                    // For inventory items, prioritize product attributes over price_list attributes
                    // This ensures specific product values (sphere, cylinder) are shown instead of range values (sphFR, sphTo)
                    ...productAttributes,
                    // Include non-conflicting price_list attributes (like index, diameter from price_list)
                    ...Object.fromEntries(
                        Object.entries(attributes).filter(([key]) => !productAttributes.hasOwnProperty(key))
                    ),
                    stock: item.stock || 0,
                    low_stock_threshold: item.low_stock_threshold || 5
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
        stock, low_stock_threshold,
        sphere, cylinder, // Single Vision specific fields
        addToInventory, // Check if adding to inventory
        inventoryOnlyUpdate // Flag to indicate this is an inventory-only update
    } = req.body;
    
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        // If this is an inventory-only update, only update supplier_id in price_list table
        if (inventoryOnlyUpdate) {
            console.log('🔧 Performing inventory-only update for item:', id);
            console.log('🔧 Price list attributes will NOT be modified');
            
            // For inventory-only updates, we still need to update supplier_id in price_list table
            // This is the ONLY field we update in price_list table for inventory-only updates
            if (supplier_id !== undefined) {
                await conn.query(
                    "UPDATE price_list SET supplier_id = ? WHERE id = ?", 
                    [supplier_id, id]
                );
                console.log('🔧 Updated ONLY supplier_id in price_list table:', supplier_id);
                console.log('🔧 All other price_list fields (description, attributes, etc.) remain unchanged');
            }
        } else {
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
                    "SELECT id FROM price_list WHERE description = ? AND id != ? AND is_deleted = 0",
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
            
            // Create attributes object for price_list (without inventory-specific fields)
            const priceListAttributes = {
                index, diameter, sphFR, sphTo, cylFr, cylTo, tp,
                steps, addFr, addTo, modality, set, bc,
                volume, set_cost, service
            };
            
            // Update price_list table
            const [result] = await conn.query(
                "UPDATE price_list SET description = ?, code = ?, pc_price = ?, pc_cost = ?, subcategory_id = ?, supplier_id = ?, attributes = ? WHERE id = ?", 
                [description, code, pc_price, pc_cost, subcategory_id, supplier_id, JSON.stringify(priceListAttributes), id]
            );
        }
        
        // Handle products table update if adding to inventory
        if (addToInventory) {
            // Check if product already exists
            const [existingProduct] = await conn.query(
                "SELECT id FROM products WHERE price_list_id = ? AND is_deleted = 0",
                [id]
            );
            
            // Create attributes object for products table (inventory-specific fields)
            const productAttributes = {
                sphere, cylinder, diameter // Single Vision specific fields for products
            };
            
            if (existingProduct.length > 0) {
                // Update existing product
                await conn.query(
                    "UPDATE products SET stock = ?, low_stock_threshold = ?, attributes = ? WHERE price_list_id = ? AND is_deleted = 0",
                    [stock || 0, low_stock_threshold || 5, JSON.stringify(productAttributes), id]
                );
            } else {
                // Create new product entry
                await conn.query(
                    "INSERT INTO products (price_list_id, stock, low_stock_threshold, attributes) VALUES (?, ?, ?, ?)",
                    [id, stock || 0, low_stock_threshold || 5, JSON.stringify(productAttributes)]
                );
            }
            
            // Inventory update will be emitted after we fetch the complete item data
        }
        // Note: We no longer automatically delete products when addToInventory is false
        // This prevents accidental deletion of products when editing pricelist items
        
        await conn.commit();
        
        // Fetch the updated item data for socket emission (same structure as getInventoryItems)
        const [updatedItemResult] = await conn.query(`
            SELECT pl.*, s.name as supplier_name, pc.name as category_name, ps.name as subcategory_name,
                   p.stock, p.low_stock_threshold, p.attributes as product_attributes,
                   JSON_UNQUOTE(pl.attributes) as attributes_json
            FROM price_list pl
            LEFT JOIN suppliers s ON pl.supplier_id = s.id
            LEFT JOIN price_subcategories ps ON pl.subcategory_id = ps.id
            LEFT JOIN price_categories pc ON ps.category_id = pc.id
            LEFT JOIN products p ON pl.id = p.price_list_id AND p.is_deleted = 0
            WHERE pl.id = ? AND pl.is_deleted = 0
        `, [id]);
        
        if (updatedItemResult.length > 0) {
            const item = updatedItemResult[0];
            // Parse attributes JSON (same logic as getInventoryItems)
            const attributes = item.attributes_json ? JSON.parse(item.attributes_json) : {};
            const productAttributes = item.product_attributes ? JSON.parse(item.product_attributes) : {};
            
            const updatedItem = {
                ...item,
                attributes: {
                    ...attributes,
                    // Include product attributes (sphere, cylinder, diameter) in the main attributes
                    ...productAttributes,
                    stock: item.stock || 0,
                    low_stock_threshold: item.low_stock_threshold || 5
                }
            };
            
            // Clean up the temporary fields
            delete updatedItem.attributes_json;
            delete updatedItem.product_attributes;
            
            // Emit Socket.IO events with complete item data
            emitSocketEvent(req, 'item-updated', { type: 'updated', item: updatedItem });
            
            // Also emit inventory update if this item is in inventory
            if (addToInventory) {
                emitSocketEvent(req, 'inventory-updated', { type: 'updated', item: updatedItem });
            }
        }
        
        res.status(200).json({message: "Item updated successfully"});
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
            SELECT pl.*, s.name as supplier_name,
                   JSON_UNQUOTE(pl.attributes) as attributes_json,
                   p.stock, p.low_stock_threshold, p.attributes as product_attributes
            FROM price_list pl
            LEFT JOIN suppliers s ON pl.supplier_id = s.id
            LEFT JOIN products p ON pl.id = p.price_list_id AND p.is_deleted = 0
            WHERE pl.id = ? AND pl.is_deleted = 0
        `, [id]);
        
        // Soft delete from price_list table
        const [result] = await conn.query("UPDATE price_list SET is_deleted = 1 WHERE id = ?", [id]);
        
        // Also soft delete from products table if it exists
        await conn.query("UPDATE products SET is_deleted = 1 WHERE price_list_id = ?", [id]);
        
        await conn.commit();
        
        if (itemToDelete.length > 0) {
            const deletedItem = itemToDelete[0];
            // Parse attributes JSON
            if (deletedItem.attributes_json) {
                deletedItem.attributes = JSON.parse(deletedItem.attributes_json);
            }
            const productAttributes = deletedItem.product_attributes ? JSON.parse(deletedItem.product_attributes) : {};
            
            // Add stock and low_stock_threshold to attributes for frontend compatibility
            deletedItem.attributes = {
                ...deletedItem.attributes,
                ...productAttributes,
                stock: deletedItem.stock || 0,
                low_stock_threshold: deletedItem.low_stock_threshold || 5
            };
            delete deletedItem.attributes_json;
            delete deletedItem.product_attributes;
            
            // Emit Socket.IO events with complete item data
            emitSocketEvent(req, 'item-updated', { type: 'deleted', item: deletedItem });
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