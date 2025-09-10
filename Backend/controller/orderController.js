require("dotenv").config();
const db = require("../config/db");

// Get all orders with supplier information (with pagination and filtering)
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      supplier_id,
      search,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    let whereConditions = ['o.is_deleted = 0'];
    let queryParams = [];
    
    if (status) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }
    
    if (supplier_id) {
      whereConditions.push('o.supplier_id = ?');
      queryParams.push(supplier_id);
    }
    
    if (search) {
      whereConditions.push('(o.receipt_number LIKE ? OR o.description LIKE ? OR s.name LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (start_date) {
      whereConditions.push('DATE(o.created_at) >= ?');
      queryParams.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('DATE(o.created_at) <= ?');
      queryParams.push(end_date);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Validate sort_by to prevent SQL injection
    const allowedSortFields = ['id', 'created_at', 'updated_at', 'status', 'total_price', 'receipt_number'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      ${whereClause}
    `;
    
    const [countResult] = await db.execute(countQuery, queryParams);
    const total = countResult[0].total;
    
    // Get orders with pagination
    const query = `
      SELECT 
        o.id,
        o.supplier_id,
        o.description,
        o.status,
        o.total_price,
        o.receipt_number,
        o.created_at,
        o.updated_at,
        s.name as supplier_name,
        s.contact_person,
        s.contact_number,
        s.email,
        s.address as supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      ${whereClause}
      ORDER BY o.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    
    const [orders] = await db.execute(query, [...queryParams, parseInt(limit), parseInt(offset)]);
    
    // Get order items for each order
    for (let order of orders) {
      const itemsQuery = `
        SELECT 
          oi.id,
          oi.order_id,
          oi.item_id,
          oi.qty,
          oi.refunded_qty,
          oi.unit_price,
          oi.status,
          oi.refunded_at,
          oi.refund_reason,
          p.code as product_code,
          p.description as product_description,
          p.pc_price,
          p.pc_cost
        FROM order_items oi
        LEFT JOIN products p ON oi.item_id = p.id
        WHERE oi.order_id = ? AND p.is_deleted = 0
      `;
      
      const [items] = await db.execute(itemsQuery, [order.id]);
      order.items = items;
    }
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: total,
        items_per_page: parseInt(limit),
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

// Get single order with items
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderQuery = `
      SELECT 
        o.id,
        o.supplier_id,
        o.description,
        o.status,
        o.total_price,
        o.receipt_number,
        o.created_at,
        o.updated_at,
        s.name as supplier_name,
        s.contact_person,
        s.contact_number,
        s.email,
        s.address as supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ? AND o.is_deleted = 0
    `;
    
    const [orders] = await db.execute(orderQuery, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.item_id,
        oi.qty,
        oi.refunded_qty,
        oi.unit_price,
        oi.status,
        oi.refunded_at,
        oi.refund_reason,
        p.code as product_code,
        p.description as product_description,
        p.pc_price,
        p.pc_cost
      FROM order_items oi
      LEFT JOIN products p ON oi.item_id = p.id
      WHERE oi.order_id = ? AND p.is_deleted = 0
    `;
    
    const [items] = await db.execute(itemsQuery, [id]);
    order.items = items;
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

// Create new order
const createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { supplier_id, description, items, receipt_number } = req.body;
    
    // Validate required fields
    if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Supplier ID and items are required' });
    }
    
    // Calculate total price
    let total_price = 0;
    for (const item of items) {
      total_price += (item.qty || 0) * (item.unit_price || 0);
    }
    
    // Insert order
    const insertOrderQuery = `
      INSERT INTO orders (supplier_id, description, status, total_price, receipt_number)
      VALUES (?, ?, 'ordered', ?, ?)
    `;
    
    const [orderResult] = await connection.execute(insertOrderQuery, [
      supplier_id,
      description || null,
      total_price,
      receipt_number || null
    ]);
    
    const orderId = orderResult.insertId;
    
    // Insert order items
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (order_id, item_id, qty, unit_price, status)
        VALUES (?, ?, ?, ?, 'pending')
      `;
      
      await connection.execute(itemQuery, [
        orderId,
        item.item_id,
        item.qty,
        item.unit_price
      ]);
    }
    
    await connection.commit();
    
    // Fetch the created order data
    const fetchOrderQuery = `
      SELECT 
        o.id,
        o.supplier_id,
        o.description,
        o.status,
        o.total_price,
        o.receipt_number,
        o.created_at,
        o.updated_at,
        s.name as supplier_name,
        s.contact_person,
        s.contact_number,
        s.email,
        s.address as supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ? AND o.is_deleted = 0
    `;
    
    const [orders] = await connection.execute(fetchOrderQuery, [orderId]);
    const createdOrder = orders[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.item_id,
        oi.qty,
        oi.refunded_qty,
        oi.unit_price,
        oi.status,
        oi.refunded_at,
        oi.refund_reason,
        p.code as product_code,
        p.description as product_description,
        p.pc_price,
        p.pc_cost
      FROM order_items oi
      LEFT JOIN products p ON oi.item_id = p.id
      WHERE oi.order_id = ? AND p.is_deleted = 0
    `;
    
    const [orderItems] = await connection.execute(itemsQuery, [orderId]);
    createdOrder.items = orderItems;
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('🔌 Emitting order-updated event for new order:', orderId);
      io.to('order-updated').emit('order-updated', {
        type: 'added',
        order: createdOrder
      });
    } else {
      console.log('❌ Socket.IO not available for order-updated event');
    }
    
    res.json(createdOrder);
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  } finally {
    connection.release();
  }
};

// Update order
const updateOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { supplier_id, description, status, items, receipt_number } = req.body;
    
    // Update order
    const updateOrderQuery = `
      UPDATE orders 
      SET supplier_id = ?, description = ?, status = ?, receipt_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0
    `;
    
    await connection.execute(updateOrderQuery, [
      supplier_id,
      description,
      status || 'ordered',
      receipt_number,
      id
    ]);
    
    // If items are provided, update them
    if (items && Array.isArray(items)) {
      // Delete existing items
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
      
      // Insert new items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, item_id, qty, unit_price, status)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        await connection.execute(itemQuery, [
          id,
          item.item_id,
          item.qty,
          item.unit_price,
          item.status || 'pending'
        ]);
      }
      
      // Recalculate total price
      let total_price = 0;
      for (const item of items) {
        total_price += (item.qty || 0) * (item.unit_price || 0);
      }
      
      await connection.execute(
        'UPDATE orders SET total_price = ? WHERE id = ?',
        [total_price, id]
      );
    }
    
    await connection.commit();
    
    // Fetch and return the updated order
    const updatedOrder = await getOrderById({ params: { id } }, res);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('order-updated').emit('order-updated', {
        type: 'updated',
        order: updatedOrder
      });
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  } finally {
    connection.release();
  }
};

// Delete order (soft delete)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'UPDATE orders SET is_deleted = 1 WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('🔌 Emitting order-updated event for delete:', id);
      console.log('🔌 Room members in order-updated:', io.sockets.adapter.rooms.get('order-updated')?.size || 0);
      io.to('order-updated').emit('order-updated', {
        type: 'deleted',
        orderId: parseInt(id)
      });
      console.log('🔌 Delete event emitted successfully');
    } else {
      console.log('❌ Socket.IO not available for order-updated event');
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'ordered' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'delivered' OR status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'on_delivery' THEN 1 ELSE 0 END) as on_delivery_orders,
        COALESCE(SUM(total_price), 0) as total_value
      FROM orders 
      WHERE is_deleted = 0
    `;
    
    const [stats] = await db.execute(statsQuery);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Failed to fetch order statistics', error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['ordered', 'on_delivery', 'delivered', 'completed', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    // Check if order exists
    const checkQuery = 'SELECT id FROM orders WHERE id = ? AND is_deleted = 0';
    const [existingOrder] = await db.execute(checkQuery, [id]);
    
    if (existingOrder.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    const updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.execute(updateQuery, [status, id]);

    // Get the updated order with supplier info
    const fetchUpdatedOrderQuery = `
      SELECT 
        o.id,
        o.supplier_id,
        o.description,
        o.status,
        o.total_price,
        o.receipt_number,
        o.created_at,
        o.updated_at,
        s.name as supplier_name,
        s.contact_person,
        s.contact_number,
        s.email,
        s.address as supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ? AND o.is_deleted = 0
    `;
    
    const [orders] = await db.execute(fetchUpdatedOrderQuery, [id]);
    const updatedOrder = orders[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.item_id,
        oi.qty,
        oi.refunded_qty,
        oi.unit_price,
        oi.status,
        oi.refunded_at,
        oi.refund_reason,
        p.code as product_code,
        p.description as product_description,
        p.pc_price,
        p.pc_cost
      FROM order_items oi
      LEFT JOIN products p ON oi.item_id = p.id
      WHERE oi.order_id = ? AND p.is_deleted = 0
    `;
    
    const [items] = await db.execute(itemsQuery, [id]);
    updatedOrder.items = items;

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('🔌 Emitting order-updated event for status update:', id);
      io.to('order-updated').emit('order-updated', {
        type: 'updated',
        order: updatedOrder
      });
    } else {
      console.log('❌ Socket.IO not available for order-updated event');
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

// Update order item status
const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'received', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: pending, received, returned' 
      });
    }

    // Check if order exists
    const orderCheckQuery = 'SELECT id FROM orders WHERE id = ? AND is_deleted = 0';
    const [orderExists] = await db.execute(orderCheckQuery, [orderId]);
    
    if (orderExists.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order item exists
    const itemCheckQuery = 'SELECT id FROM order_items WHERE id = ? AND order_id = ?';
    const [itemExists] = await db.execute(itemCheckQuery, [itemId, orderId]);
    
    if (itemExists.length === 0) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Update the item status
    const updateQuery = 'UPDATE order_items SET status = ? WHERE id = ? AND order_id = ?';
    await db.execute(updateQuery, [status, itemId, orderId]);

    // Get the updated order with items
    const fetchUpdatedOrderQuery = `
      SELECT 
        o.id,
        o.supplier_id,
        o.description,
        o.status,
        o.total_price,
        o.receipt_number,
        o.created_at,
        o.updated_at,
        s.name as supplier_name,
        s.contact_person,
        s.contact_number,
        s.email,
        s.address as supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ? AND o.is_deleted = 0
    `;
    
    const [orders] = await db.execute(fetchUpdatedOrderQuery, [orderId]);
    const updatedOrder = orders[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.item_id,
        oi.qty,
        oi.refunded_qty,
        oi.unit_price,
        oi.status,
        oi.refunded_at,
        oi.refund_reason,
        p.code as product_code,
        p.description as product_description,
        p.pc_price,
        p.pc_cost
      FROM order_items oi
      LEFT JOIN products p ON oi.item_id = p.id
      WHERE oi.order_id = ? AND p.is_deleted = 0
    `;
    
    const [items] = await db.execute(itemsQuery, [orderId]);
    updatedOrder.items = items;

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      console.log('🔌 Emitting order-updated event for item status update:', orderId);
      io.to('order-updated').emit('order-updated', {
        type: 'updated',
        order: updatedOrder
      });
    } else {
      console.log('❌ Socket.IO not available for order-updated event');
    }

    res.json({
      message: 'Order item status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order item status:', error);
    res.status(500).json({ message: 'Failed to update order item status', error: error.message });
  }
};

// Return order item with quantity and reason
const returnOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { returned_quantity, refund_reason } = req.body;

    // Validate returned quantity
    if (!returned_quantity || returned_quantity <= 0) {
      return res.status(400).json({ 
        message: 'Returned quantity must be greater than 0' 
      });
    }

    // Validate refund reason
    if (!refund_reason || refund_reason.trim() === '') {
      return res.status(400).json({ 
        message: 'Refund reason is required' 
      });
    }

    // Check if order exists
    const orderCheckQuery = 'SELECT id FROM orders WHERE id = ? AND is_deleted = 0';
    const [orderExists] = await db.execute(orderCheckQuery, [orderId]);
    
    if (orderExists.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order item exists and get current data
    const itemCheckQuery = `
      SELECT id, qty, refunded_qty, status, item_id 
      FROM order_items 
      WHERE id = ? AND order_id = ?
    `;
    const [itemExists] = await db.execute(itemCheckQuery, [itemId, orderId]);
    
    if (itemExists.length === 0) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    const item = itemExists[0];
    const currentRefundedQty = item.refunded_qty || 0;
    const totalQty = item.qty;
    const newRefundedQty = currentRefundedQty + returned_quantity;

    // Check if returned quantity exceeds available quantity
    if (newRefundedQty > totalQty) {
      return res.status(400).json({ 
        message: `Cannot return ${returned_quantity} items. Only ${totalQty - currentRefundedQty} items available for return.` 
      });
    }

    // Update the item refunded quantity, status, and refund reason
    const newStatus = newRefundedQty === totalQty ? 'returned' : 'partially_returned';
    
    const updateQuery = `
      UPDATE order_items 
      SET refunded_qty = ?, status = ?, refund_reason = ?, refunded_at = CONVERT_TZ(NOW(), '+00:00', '+08:00')
      WHERE id = ? AND order_id = ?
    `;
    
    await db.execute(updateQuery, [newRefundedQty, newStatus, refund_reason.trim(), itemId, orderId]);

    // Re-update the item status to partially_returned if needed (after trigger runs)
    if (newStatus === 'partially_returned') {
      await db.execute(
        'UPDATE order_items SET status = ? WHERE id = ? AND order_id = ?',
        ['partially_returned', itemId, orderId]
      );
    }

    // Restore stock for the returned quantity
    await db.execute(
      "UPDATE products SET stock = stock + ? WHERE id = ?",
      [returned_quantity, item.item_id]
    );

    // Get the updated order with items
    const fetchUpdatedOrderQuery = `
      SELECT 
        o.id,
        o.supplier_id,
        o.description,
        o.status,
        o.total_price,
        o.receipt_number,
        o.created_at,
        o.updated_at,
        s.name as supplier_name,
        s.contact_person,
        s.contact_number,
        s.email,
        s.address as supplier_address
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      WHERE o.id = ? AND o.is_deleted = 0
    `;
    
    const [orders] = await db.execute(fetchUpdatedOrderQuery, [orderId]);
    const updatedOrder = orders[0];
    
    // Get order items
    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id,
        oi.item_id,
        oi.qty,
        oi.refunded_qty,
        oi.unit_price,
        oi.status,
        oi.refunded_at,
        oi.refund_reason,
        p.code as product_code,
        p.description as product_description,
        p.pc_price,
        p.pc_cost
      FROM order_items oi
      LEFT JOIN products p ON oi.item_id = p.id
      WHERE oi.order_id = ? AND p.is_deleted = 0
    `;
    
    const [items] = await db.execute(itemsQuery, [orderId]);
    updatedOrder.items = items;

    res.json({
      message: 'Item returned successfully',
      order: updatedOrder,
      returned_quantity: newRefundedQty
    });

  } catch (error) {
    console.error('Error returning order item:', error);
    res.status(500).json({ message: 'Failed to return order item', error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateOrderItemStatus,
  returnOrderItem,
  deleteOrder,
  getOrderStats
};
