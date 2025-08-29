import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { getInventoryItems, updateItem } from '../../../services/item';
import { getSuppliers } from '../../../services/supplier';

function Inventory() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ supplier_id: '', stock: '', low_stock_threshold: '' });
  const abortRef = useRef(null);
  useEffect(() => {
    abortRef.current = new AbortController();
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const data = await getInventoryItems(abortRef.current.signal);
        setItems(data);
      } catch (err) {
        if (err.message !== 'Request cancelled') {
          console.error('Failed to load inventory items:', err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    const fetchSuppliersList = async () => {
      try {
        const s = await getSuppliers(abortRef.current.signal);
        setSuppliers(s);
      } catch (e) {
        // ignore
      }
    };
    fetchInventory();
    fetchSuppliersList();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType={userRole}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden mr-4 text-gray-300 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
              </div>
              <div className="flex space-x-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Inventory Items</h2>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div>
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-300">No inventory items</h3>
                      <p className="mt-1 text-sm text-gray-400">Items appear here after being added to inventory.</p>
                    </div>
                  ) : (
                    <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-900/60 border border-gray-700 rounded-lg">
                          <thead className="bg-gray-800/80 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Supplier</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Index</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Diameter</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">SphFR</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">SphTo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">CylFr</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">CylTo</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Steps</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Modality</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Set</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">BC</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">PC Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">PC Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Stock</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-800/40 transition-colors duration-200">
                                <td className="px-4 py-3 text-sm text-white font-medium whitespace-nowrap">{item.description}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.code || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.supplier_name || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.index || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.diameter || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.sphFR || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.sphTo || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.cylFr || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.cylTo || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.steps || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.modality || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.set || '-'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.bc || '-'}</td>
                                <td className="px-4 py-3 text-sm text-green-400 font-semibold whitespace-nowrap">₱{parseFloat(item.pc_price || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">₱{parseFloat(item.pc_cost || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{item.attributes?.stock ?? '-'}</td>
                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                  {(() => {
                                    const stock = Number(item.attributes?.stock ?? 0);
                                    const low = Number(item.attributes?.low_stock_threshold ?? 0);
                                    const status = stock <= 0 ? 'Out of stock' : stock <= low ? 'Low' : 'Normal';
                                    const color = stock <= 0 ? 'text-red-400' : stock <= low ? 'text-yellow-400' : 'text-green-400';
                                    return <span className={`${color} font-medium`}>{status}</span>;
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setEditForm({
                                        supplier_id: item.supplier_id || '',
                                        stock: item.attributes?.stock ?? '',
                                        low_stock_threshold: item.attributes?.low_stock_threshold ?? ''
                                      });
                                    }}
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Inventory</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                  <select
                    value={editForm.supplier_id}
                    onChange={(e) => setEditForm({ ...editForm, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Low stock threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.low_stock_threshold}
                    onChange={(e) => setEditForm({ ...editForm, low_stock_threshold: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Save supplier_id directly; stock and threshold in attributes
                      const payload = {
                        ...editingItem,
                        supplier_id: editForm.supplier_id || null,
                        ...editingItem.attributes,
                        stock: editForm.stock,
                        low_stock_threshold: editForm.low_stock_threshold
                      };
                      await updateItem(editingItem.id, payload);
                      setEditingItem(null);
                      // refresh list
                      setIsLoading(true);
                      const data = await getInventoryItems();
                      setItems(data);
                      setIsLoading(false);
                    } catch (e) {
                      console.error('Failed to update item', e);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
