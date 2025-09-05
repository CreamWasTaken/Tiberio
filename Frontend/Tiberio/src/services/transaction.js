import { apiClient } from './apiUtils';

// Create a new transaction
export const createTransaction = async (transactionData) => {
  try {
    const response = await apiClient.post('/api/transactions/add-transaction', transactionData);
    return response.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error(error.response?.data?.error || 'Failed to create transaction');
  }
};

// Get all transactions
export const getTransactions = async () => {
  try {
    const response = await apiClient.get('/api/transactions/get-transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch transactions');
  }
};

// Get transaction by ID
export const getTransactionById = async (transactionId) => {
  try {
    const response = await apiClient.get(`/api/transactions/get-transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch transaction');
  }
};


// Delete transaction
export const deleteTransaction = async (transactionId) => {
  try {
    const response = await apiClient.delete(`/api/transactions/delete-transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(error.response?.data?.error || 'Failed to delete transaction');
  }
};

// Fulfill individual transaction item
export const fulfillTransactionItem = async (itemId) => {
  try {
    const response = await apiClient.patch(`/api/transactions/fulfill-item/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fulfilling transaction item:', error);
    throw new Error(error.response?.data?.error || 'Failed to fulfill transaction item');
  }
};

// Refund individual transaction item
export const refundTransactionItem = async (itemId, refundedQuantity) => {
  try {
    const response = await apiClient.patch(`/api/transactions/refund-item/${itemId}`, {
      refunded_quantity: refundedQuantity
    });
    return response.data;
  } catch (error) {
    console.error('Error refunding transaction item:', error);
    throw new Error(error.response?.data?.error || 'Failed to refund transaction item');
  }
};

// Get transactions by patient ID - NOT IMPLEMENTED IN BACKEND
// export const getTransactionsByPatient = async (patientId) => {
//   try {
//     const response = await apiClient.get(`/api/transactions/patient/${patientId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching patient transactions:', error);
//     throw new Error(error.response?.data?.error || 'Failed to fetch patient transactions');
//   }
// };
