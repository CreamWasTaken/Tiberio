import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Get all orders with pagination and filtering
export const getOrders = async (params = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const queryParams = new URLSearchParams();
    
    // Add pagination parameters
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    // Add filtering parameters
    if (params.status) queryParams.append('status', params.status);
    if (params.supplier_id) queryParams.append('supplier_id', params.supplier_id);
    if (params.search) queryParams.append('search', params.search);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    // Add sorting parameters
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const url = `${API_URL}/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch orders');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Get single order by ID
export const getOrderById = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/orders/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch order');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Get order statistics
export const getOrderStats = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.get(`${API_URL}/api/orders/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order stats:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch order statistics');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Create new order
export const createOrder = async (orderData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/api/orders`, orderData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create order');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Update order
export const updateOrder = async (id, orderData) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.put(`${API_URL}/api/orders/${id}`, orderData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update order');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Update order status
export const updateOrderStatus = async (id, status) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.patch(`${API_URL}/api/orders/${id}/status`, 
      { status },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update order status');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Update order item status
export const updateOrderItemStatus = async (orderId, itemId, status) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.patch(`${API_URL}/api/orders/${orderId}/items/${itemId}/status`, 
      { status },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating order item status:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update order item status');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Return order item with quantity and reason
export const returnOrderItem = async (orderId, itemId, returnedQuantity, refundReason) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.patch(`${API_URL}/api/orders/${orderId}/items/${itemId}/return`, 
      { 
        returned_quantity: returnedQuantity,
        refund_reason: refundReason
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error returning order item:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to return order item');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await axios.delete(`${API_URL}/api/orders/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete order');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message);
    }
  }
};
