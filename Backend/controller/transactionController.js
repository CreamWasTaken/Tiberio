require("dotenv").config();
const db = require("../config/db");

// Create a new transaction with items
exports.createTransaction = async (req, res) => {
  try {
    const {
      user_id,
      patient_id,
      receipt_number,
      items, // Array of items with product_id, quantity, discount (unit_price will be fetched from products table)
      discount_percent = 0.00
    } = req.body;

    // Validate required fields
    if (!user_id || !receipt_number || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields: user_id, receipt_number, and items array" });
    }

    // Check if receipt number already exists
    const [existingReceipt] = await db.execute(
      "SELECT id FROM transactions WHERE receipt_number = ?",
      [receipt_number]
    );

    if (existingReceipt.length > 0) {
      return res.status(400).json({ error: "Receipt number already exists" });
    }

    // Calculate totals
    let subtotal_price = 0;
    let total_discount = 0;

    // Validate items and calculate totals
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return res.status(400).json({ error: "Each item must have product_id and quantity" });
      }
      
      // Check if product exists and get PC price
      const [existingProduct] = await db.execute(
        "SELECT id, stock, pc_price FROM products WHERE id = ? AND is_deleted = 0",
        [item.product_id]
      );

      if (existingProduct.length === 0) {
        return res.status(404).json({ error: `Product with ID ${item.product_id} not found` });
      }

      if (existingProduct[0].stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ID ${item.product_id}` });
      }

      // Use PC price from products table
      const unit_price = existingProduct[0].pc_price;
      const itemTotal = item.quantity * unit_price;
      const itemDiscount = item.discount || 0;
      
      subtotal_price += itemTotal;
      total_discount += itemDiscount;
    }

    const final_price = subtotal_price - total_discount;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert transaction
      const [transactionResult] = await connection.execute(
        `INSERT INTO transactions 
         (user_id, patient_id, receipt_number, subtotal_price, total_discount, final_price, discount_percent, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [user_id, patient_id, receipt_number, subtotal_price, total_discount, final_price, discount_percent]
      );

      const transaction_id = transactionResult.insertId;

      // Insert transaction items
      for (const item of items) {
        // Get PC price for this specific item
        const [productData] = await connection.execute(
          "SELECT pc_price FROM products WHERE id = ?",
          [item.product_id]
        );
        
        const unit_price = productData[0].pc_price;

        await connection.execute(
          `INSERT INTO transaction_items 
           (transaction_id, product_id, status, quantity, unit_price, discount) 
           VALUES (?, ?, 'pending', ?, ?, ?)`,
          [transaction_id, item.product_id, item.quantity, unit_price, item.discount || 0]
        );

        // Update product stock
        await connection.execute(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: "Transaction created successfully",
        transaction_id: transaction_id,
        receipt_number: receipt_number,
        subtotal_price: subtotal_price,
        total_discount: total_discount,
        final_price: final_price
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all transactions with their items
exports.getAllTransactions = async (req, res) => {
  try {
    const [transactions] = await db.execute(
      `SELECT t.*, 
              u.first_name as user_first_name, 
              u.last_name as user_last_name,
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN patients p ON t.patient_id = p.id
       WHERE t.deleted_at IS NULL
       ORDER BY t.created_at DESC`
    );

    // Get items for each transaction
    for (let transaction of transactions) {
      const [items] = await db.execute(
        `SELECT ti.*, p.description as product_description, p.code as product_code
         FROM transaction_items ti
         LEFT JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = ?`,
        [transaction.id]
      );
      transaction.items = items;
    }

    res.json(transactions);

  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get transaction by ID with items
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [transactions] = await db.execute(
      `SELECT t.*, 
              u.first_name as user_first_name, 
              u.last_name as user_last_name,
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN patients p ON t.patient_id = p.id
       WHERE t.id = ? AND t.deleted_at IS NULL`,
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Get transaction items
    const [items] = await db.execute(
      `SELECT ti.*, p.description as product_description, p.code as product_code
       FROM transaction_items ti
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = ?`,
      [id]
    );

    const transaction = transactions[0];
    transaction.items = items;

    res.json(transaction);

  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update transaction status and items
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      items // Optional: array of updated items
    } = req.body;

    // Check if transaction exists
    const [existingTransaction] = await db.execute(
      "SELECT id, status FROM transactions WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (existingTransaction.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update transaction status
      if (status) {
        await connection.execute(
          "UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [status, id]
        );
      }

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Get current items to restore stock if status changes
        const [currentItems] = await connection.execute(
          "SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?",
          [id]
        );

        // Update each item
        for (const item of items) {
          if (item.id && item.quantity && item.unit_price !== undefined) {
            await connection.execute(
              `UPDATE transaction_items 
               SET quantity = ?, unit_price = ?, discount = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ? AND transaction_id = ?`,
              [item.quantity, item.unit_price, item.discount || 0, item.id, id]
            );
          }
        }

        // Recalculate transaction totals
        const [updatedItems] = await connection.execute(
          "SELECT quantity, unit_price, discount FROM transaction_items WHERE transaction_id = ?",
          [id]
        );

        let subtotal_price = 0;
        let total_discount = 0;

        for (const item of updatedItems) {
          subtotal_price += item.quantity * item.unit_price;
          total_discount += item.discount || 0;
        }

        const final_price = subtotal_price - total_discount;

        await connection.execute(
          `UPDATE transactions 
           SET subtotal_price = ?, total_discount = ?, final_price = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [subtotal_price, total_discount, final_price, id]
        );
      }

      await connection.commit();
      connection.release();

      res.json({ message: "Transaction updated successfully" });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fulfill transaction (change status to fulfilled)
exports.fulfillTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const [existingTransaction] = await db.execute(
      "SELECT id, status FROM transactions WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (existingTransaction.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (existingTransaction[0].status === 'fulfilled') {
      return res.status(400).json({ error: "Transaction is already fulfilled" });
    }

    // Update transaction and items status
    await db.execute(
      "UPDATE transactions SET status = 'fulfilled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    await db.execute(
      "UPDATE transaction_items SET status = 'fulfilled', updated_at = CURRENT_TIMESTAMP WHERE transaction_id = ?",
      [id]
    );

    res.json({ message: "Transaction fulfilled successfully" });

  } catch (error) {
    console.error("Error fulfilling transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cancel transaction (restore stock and change status)
exports.cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const [existingTransaction] = await db.execute(
      "SELECT id, status FROM transactions WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (existingTransaction.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (existingTransaction[0].status === 'cancelled') {
      return res.status(400).json({ error: "Transaction is already cancelled" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get items to restore stock
      const [items] = await connection.execute(
        "SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?",
        [id]
      );

      // Restore stock for each product
      for (const item of items) {
        await connection.execute(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }

      // Update transaction and items status
      await connection.execute(
        "UPDATE transactions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      await connection.execute(
        "UPDATE transaction_items SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE transaction_id = ?",
        [id]
      );

      await connection.commit();
      connection.release();

      res.json({ message: "Transaction cancelled successfully" });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("Error cancelling transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete transaction (soft delete)
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const [existingTransaction] = await db.execute(
      "SELECT id FROM transactions WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (existingTransaction.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Soft delete transaction
    await db.execute(
      "UPDATE transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    res.json({ message: "Transaction deleted successfully" });

  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fulfill individual transaction item
exports.fulfillTransactionItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    // Check if transaction item exists
    const [existingItem] = await db.execute(
      "SELECT id, status, transaction_id FROM transaction_items WHERE id = ?",
      [itemId]
    );

    if (existingItem.length === 0) {
      return res.status(404).json({ error: "Transaction item not found" });
    }

    if (existingItem[0].status === 'fulfilled') {
      return res.status(400).json({ error: "Item is already fulfilled" });
    }

    // Update item status to fulfilled and reset refunded quantity
    await db.execute(
      "UPDATE transaction_items SET status = 'fulfilled', refunded_quantity = 0, refunded_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [itemId]
    );

    // Check if all items in the transaction are now fulfilled
    const [remainingItems] = await db.execute(
      "SELECT COUNT(*) as pending_count FROM transaction_items WHERE transaction_id = ? AND status != 'fulfilled'",
      [existingItem[0].transaction_id]
    );

    // If all items are fulfilled, update the transaction status as well
    if (remainingItems[0].pending_count === 0) {
      await db.execute(
        "UPDATE transactions SET status = 'fulfilled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [existingItem[0].transaction_id]
      );
    }

    res.json({ 
      message: "Item fulfilled successfully",
      transaction_id: existingItem[0].transaction_id,
      all_items_fulfilled: remainingItems[0].pending_count === 0
    });

  } catch (error) {
    console.error("Error fulfilling transaction item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Refund individual transaction item
exports.refundTransactionItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { refunded_quantity } = req.body;

    // Validate refunded quantity
    if (!refunded_quantity || refunded_quantity <= 0) {
      return res.status(400).json({ error: "Refunded quantity must be greater than 0" });
    }

    // Check if transaction item exists and get current data
    const [existingItem] = await db.execute(
      "SELECT id, status, transaction_id, quantity, refunded_quantity, product_id FROM transaction_items WHERE id = ?",
      [itemId]
    );

    if (existingItem.length === 0) {
      return res.status(404).json({ error: "Transaction item not found" });
    }

    const item = existingItem[0];
    const currentRefundedQuantity = item.refunded_quantity || 0;
    const totalQuantity = item.quantity;
    const newRefundedQuantity = currentRefundedQuantity + refunded_quantity;

    // Check if refunded quantity exceeds available quantity
    if (newRefundedQuantity > totalQuantity) {
      return res.status(400).json({ 
        error: `Cannot refund ${refunded_quantity} items. Only ${totalQuantity - currentRefundedQuantity} items available for refund.` 
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update item refunded quantity and status
      const newStatus = newRefundedQuantity === totalQuantity ? 'refunded' : 'partially_refunded';
      
      // Get current time in Philippine timezone
      const phTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"});
      
      await connection.execute(
        `UPDATE transaction_items 
         SET refunded_quantity = ?, status = ?, refunded_at = CONVERT_TZ(NOW(), '+00:00', '+08:00'), updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [newRefundedQuantity, newStatus, itemId]
      );

      // Restore stock for the refunded quantity
      await connection.execute(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
        [refunded_quantity, item.product_id]
      );

      await connection.commit();
      connection.release();

      res.json({ 
        message: "Item refunded successfully",
        transaction_id: item.transaction_id,
        refunded_quantity: newRefundedQuantity,
        total_quantity: totalQuantity,
        status: newStatus
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("Error refunding transaction item:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get transaction items by transaction ID
exports.getTransactionItems = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const [items] = await db.execute(
      `SELECT ti.*, p.description as product_description, p.code as product_code
       FROM transaction_items ti
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = ?`,
      [transactionId]
    );

    res.json(items);

  } catch (error) {
    console.error("Error fetching transaction items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};