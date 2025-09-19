import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { getPatients as fetchPatientsApi, addPatient as addPatientApi, getPatientCheckups, addCheckup as addCheckupApi, updateCheckup as updateCheckupApi, deleteCheckup as deleteCheckupApi, getTotalCheckupsCount } from '../../../services/patient';
import { createTransaction, getTransactions, fulfillTransactionItem, refundTransactionItem, deleteTransaction } from '../../../services/transaction';
import Sidebar from '../../../components/Sidebar';
import AddPatientModal from './components/AddPatientModal';
import AddCheckupModal from './components/AddCheckupModal';
import socketService from '../../../services/socket';
import AddTransactionModal from './components/AddTransactionModal';
import Alert from '../../../components/Alert';

// Memoized TransactionItem component for better performance
const TransactionItem = memo(({ 
  transaction, 
  isExpanded, 
  onToggle, 
  onDelete, 
  onFulfill, 
  onRefund,
  userRole,
  formatDateYMDSlash 
}) => {
  const itemCalculations = useMemo(() => {
    const fulfilledCount = transaction.items?.filter(item => item.status === 'fulfilled').length || 0;
    const pendingCount = transaction.items?.filter(item => item.status === 'pending').length || 0;
    const refundedCount = transaction.items?.filter(item => item.status === 'refunded').length || 0;
    
    return { fulfilledCount, pendingCount, refundedCount };
  }, [transaction.items]);

  // Memoize formatted dates to avoid recalculation
  const formattedDates = useMemo(() => ({
    transactionDate: transaction.transaction_date ? formatDateYMDSlash(transaction.transaction_date) : null,
    createdAt: transaction.created_at ? formatDateYMDSlash(transaction.created_at) : null
  }), [transaction.transaction_date, transaction.created_at, formatDateYMDSlash]);

  // Memoize price calculations
  const priceCalculations = useMemo(() => ({
    finalPrice: Number(transaction.final_price || 0).toLocaleString(),
    subtotalPrice: Number(transaction.subtotal_price || 0).toLocaleString(),
    totalDiscount: Number(transaction.total_discount || 0).toLocaleString()
  }), [transaction.final_price, transaction.subtotal_price, transaction.total_discount]);

  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex-1 flex items-center justify-between text-left hover:bg-gray-800/60"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <span
              className={
                'inline-block w-4 h-4 text-gray-300 transform transition-transform ' +
                (isExpanded ? 'rotate-90' : '')
              }
            >
              ▶
            </span>

            <div className="flex items-center justify-between w-full">
              {/* Left side - Receipt number and date */}
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-1">
                  <div className="text-white font-medium text-sm">
                    Receipt #{transaction.receipt_number}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formattedDates.transactionDate || formattedDates.createdAt || '—'}
                  </div>
                </div>
                {transaction.discount_percent && transaction.discount_percent > 0 && (
                  <div>
                    <span className="text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded text-xs">
                      {transaction.discount_percent}% OFF
                    </span>
                  </div>
                )}
              </div>
              
              {/* Right side - Price and added by */}
              <div className="flex flex-col items-end">
                <div className="text-green-400 font-semibold text-lg mb-1">
                  ₱{priceCalculations.finalPrice}
                </div>
                <div className="text-gray-500 text-xs">
                  Added by: {transaction.user_first_name && transaction.user_last_name ? `${transaction.user_first_name} ${transaction.user_last_name}` : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          {userRole === 'admin' && (
            <>
              <button
                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                onClick={onDelete}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      {isExpanded && (
        <TransactionExpandedContent
          transaction={transaction}
          itemCalculations={itemCalculations}
          priceCalculations={priceCalculations}
          formattedDates={formattedDates}
          userRole={userRole}
          onFulfill={onFulfill}
          onRefund={onRefund}
        />
      )}
    </div>
  );
});

TransactionItem.displayName = 'TransactionItem';

// Memoized component for expanded transaction content
const TransactionExpandedContent = memo(({ 
  transaction, 
  itemCalculations, 
  priceCalculations, 
  formattedDates,
  userRole,
  onFulfill,
  onRefund 
}) => {
  return (
    <div className="px-4 pb-3 border-t border-gray-700">
      <div className="pt-4 space-y-4 text-sm">
        {/* Financial Summary */}
        <div className="bg-gray-800/40 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Financial Summary</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-white font-medium">₱{priceCalculations.subtotalPrice}</span>
            </div>
            {transaction.discount_percent && transaction.discount_percent > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount ({transaction.discount_percent}%):</span>
                  <span className="text-orange-400 font-medium">-₱{priceCalculations.totalDiscount}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-gray-600 pt-2 col-span-2">
              <span className="text-gray-300 font-medium">Total Amount:</span>
              <span className="text-green-400 font-bold text-lg">₱{priceCalculations.finalPrice}</span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-gray-800/40 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Transaction Details</h4>
          <div className="space-y-2">
            {transaction.patient_first_name && transaction.patient_last_name && (
              <div className="flex justify-between">
                <span className="text-gray-400">Patient:</span>
                <span className="text-white">{transaction.patient_first_name} {transaction.patient_last_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-white capitalize">{transaction.status || 'Completed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Receipt Number:</span>
              <span className="text-white font-mono">#{transaction.receipt_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction Date:</span>
              <span className="text-white">{formattedDates.transactionDate || formattedDates.createdAt || '—'}</span>
            </div>
          </div>
        </div>
        {/* Items List */}
        {transaction.items && transaction.items.length > 0 && (
          <div className="bg-gray-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Items Purchased ({transaction.items.length})</h4>
              <div className="flex items-center gap-2 text-sm">
                {itemCalculations.fulfilledCount > 0 && (
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                    {itemCalculations.fulfilledCount} Fulfilled
                  </span>
                )}
                {itemCalculations.pendingCount > 0 && (
                  <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                    {itemCalculations.pendingCount} Pending
                  </span>
                )}
                {itemCalculations.refundedCount > 0 && (
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                    {itemCalculations.refundedCount} Refunded
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {transaction.items.map((item, index) => (
                <TransactionItemDetail
                  key={index}
                  item={item}
                  userRole={userRole}
                  onFulfill={onFulfill}
                  onRefund={onRefund}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TransactionExpandedContent.displayName = 'TransactionExpandedContent';

// Memoized component for individual transaction items
const TransactionItemDetail = memo(({ item, userRole, onFulfill, onRefund }) => {
  const itemCalculations = useMemo(() => {
    const basePrice = (item.quantity || 0) * (item.unit_price || 0);
    const itemDiscount = item.discount || 0;
    const itemTotal = basePrice - itemDiscount;
    const isFulfilled = item.status === 'fulfilled';
    
    return { basePrice, itemDiscount, itemTotal, isFulfilled };
  }, [item.quantity, item.unit_price, item.discount, item.status]);
  
  const { basePrice, itemDiscount, itemTotal, isFulfilled } = itemCalculations;
  
  return (
    <div className={`bg-gray-700/40 rounded-md p-3 border-l-4 ${
      item.status === 'fulfilled' 
        ? 'border-green-500' 
        : item.status === 'pending'
        ? 'border-yellow-500'
        : item.status === 'refunded'
        ? 'border-red-500'
        : item.status === 'partially_refunded'
        ? 'border-orange-500'
        : 'border-blue-500'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white font-medium">
              {item.product_description || item.product_code || 'Unknown Product'}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              item.status === 'fulfilled' 
                ? 'bg-green-600 text-white' 
                : item.status === 'pending'
                ? 'bg-yellow-600 text-white'
                : item.status === 'refunded'
                ? 'bg-red-600 text-white'
                : item.status === 'partially_refunded'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-600 text-white'
            }`}>
              {item.status === 'fulfilled' && '✓ Fulfilled'}
              {item.status === 'pending' && '⏳ Pending'}
              {item.status === 'refunded' && '↩️ Refunded'}
              {item.status === 'partially_refunded' && '↩️ Partially Refunded'}
              {!item.status && '❓ Unknown'}
            </span>
          </div>
          <div className="text-gray-400 text-xs mb-1">
            Product Code: {item.product_code || 'N/A'}
          </div>
          <div className="text-gray-300 text-sm">
            Quantity: {item.quantity || 0} × ₱{Number(item.unit_price || 0).toLocaleString()} each
            {item.refunded_quantity > 0 && (
              <div className="text-orange-400 text-xs mt-1">
                Refunded: {item.refunded_quantity} / {item.quantity}
              </div>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          {itemDiscount > 0 && (
            <div className="text-gray-400 text-xs line-through mb-1">
              ₱{Number(basePrice).toLocaleString()}
            </div>
          )}
          <div className="text-green-400 font-semibold text-lg">
            ₱{Number(itemTotal).toLocaleString()}
          </div>
          {itemDiscount > 0 && (
            <div className="text-orange-400 text-xs">
              Saved: ₱{Number(itemDiscount).toLocaleString()}
            </div>
          )}
          <div className="flex flex-col gap-1 mt-2">
            {!isFulfilled && (userRole === 'admin' || userRole === 'employee') && (
              <button
                onClick={() => onFulfill(item)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors duration-200"
              >
                Fulfill Item
              </button>
            )}
            {(userRole === 'admin' || userRole === 'employee') && item.status !== 'refunded' && (
              <button
                onClick={() => onRefund(item)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors duration-200"
              >
                Refund Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TransactionItemDetail.displayName = 'TransactionItemDetail';

function Patients() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [totalCheckups, setTotalCheckups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/');
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await fetchPatientsApi();
        setPatients(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Socket.IO real-time updates for patients
  useEffect(() => {
    const setupSocketIO = async () => {
      try {
        // Wait for Socket.IO connection to be established
        const socket = await socketService.waitForConnection();
        
        // Join patient update room
        socketService.joinRoom('patient-updated');
        
        // Listen for patient updates
        const handlePatientUpdate = (data) => {
          console.log('🔌 Real-time patient update received:', data);
          
          if (data.type === 'added') {
            // Add new patient to the list
            setPatients(prevPatients => [...prevPatients, data.patient]);
          } else if (data.type === 'updated') {
            // Update existing patient in the list
            setPatients(prevPatients => 
              prevPatients.map(patient => 
                patient.id === data.patient.id ? data.patient : patient
              )
            );
          } else if (data.type === 'deleted') {
            // Remove deleted patient from the list
            setPatients(prevPatients => 
              prevPatients.filter(patient => patient.id !== data.patientId)
            );
          }
        };

        socket.on('patient-updated', handlePatientUpdate);

        return () => {
          socket.off('patient-updated', handlePatientUpdate);
          socketService.leaveRoom('patient-updated');
        };
      } catch (error) {
        console.error('Failed to setup Socket.IO:', error);
      }
    };

    setupSocketIO();
  }, []);

  // Load total checkups count
  useEffect(() => {
    const loadTotalCheckups = async () => {
      try {
        const count = await getTotalCheckupsCount();
        setTotalCheckups(Number(count) || 0);
      } catch {
        // keep silent for now
      }
    };
    loadTotalCheckups();
  }, []);

  const totalPatients = patients.length;
  // const activePatients = patients.length; // kept for future use if needed

  const getYearMonthInTz = (dateLike, timeZone) => {
    if (!dateLike) return { year: '0000', month: '00' };
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(date);
    return {
      year: parts.find(p => p.type === 'year')?.value || '0000',
      month: parts.find(p => p.type === 'month')?.value || '00'
    };
  };

  const { year: currentYearPH, month: currentMonthPH } = getYearMonthInTz(new Date(), 'Asia/Manila');
  const thisMonthCount = patients.filter((p) => {
    const { year, month } = getYearMonthInTz(p.created_at, 'Asia/Manila');
    return year === currentYearPH && month === currentMonthPH;
  }).length;

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('checkups');
  const [checkups, setCheckups] = useState([]);
  const [expandedCheckups, setExpandedCheckups] = useState({});
  const [isAddCheckupOpen, setIsAddCheckupOpen] = useState(false);
  const [isSavingCheckup, setIsSavingCheckup] = useState(false);
  const [checkupFormError, setCheckupFormError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCheckupId, setEditingCheckupId] = useState(null);
  const initialCheckupForm = {
    checkup_date: new Date().toISOString().split('T')[0], // Sets today's date in YYYY-MM-DD format
    notes: '',
    diagnosis: '',
    binocular_pd: '',
    spectacle: {
      sphereRight: '', cylinderRight: '', axisRight: '', additionRight: '', visualAcuityRight: '', monocularPdRight: '',
      sphereLeft: '', cylinderLeft: '', axisLeft: '', additionLeft: '', visualAcuityLeft: '', monocularPdLeft: ''
    },
    contact: {
      sphereRight: '', sphereLeft: '', cylinderRight: '', cylinderLeft: '', axisRight: '', axisLeft: '', additionRight: '', additionLeft: '', baseCurveRight: '', baseCurveLeft: '', diameterRight: '', diameterLeft: ''
    }
  };
  const [checkupForm, setCheckupForm] = useState(initialCheckupForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    sex: '',
    birthdate: '',
    address: '',
    contact_number: '',
    telephone_number: '',
    senior_number: ''
  });

  // Suggestion dropdown state and refs
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Custom alert state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'error'
    onConfirm: null,
    onCancel: null
  });

  const formatDateYMD = (value) => {
    if (!value) return '—';
    if (typeof value === 'string') {
      // If value is ISO-like (contains 'T'), format in Asia/Manila
      if (value.includes('T')) {
        const date = new Date(value);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(date);
        const y = parts.find(p => p.type === 'year')?.value || '0000';
        const m = parts.find(p => p.type === 'month')?.value || '01';
        const d = parts.find(p => p.type === 'day')?.value || '01';
        return `${y}-${m}-${d}`;
      }
      // Already date-only string (YYYY-MM-DD)
      return value.slice(0, 10);
    }
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(value);
      const y = parts.find(p => p.type === 'year')?.value || '0000';
      const m = parts.find(p => p.type === 'month')?.value || '01';
      const d = parts.find(p => p.type === 'day')?.value || '01';
      return `${y}-${m}-${d}`;
    } catch {
      return '—';
    }
  };

  const formatDateYMDSlash = (value) => {
    const ymd = formatDateYMD(value);
    if (!ymd || ymd === '—') return '—';
    return ymd.replaceAll('-', '/');
  };

  // Default select first patient whenever list is populated and none selected
  useEffect(() => {
    if (!selectedPatient && patients && patients.length > 0) {
      const p = patients[0];
      const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient ${p.id}`;
      const phone = p.contact_number || p.telephone_number || '—';
      const birthdate = formatDateYMD(p.birthdate);
      setSelectedPatient({ ...p, displayName, phone, birthdate, status: p.status || 'Active' });
    }
  }, [patients, selectedPatient]);

  // Load checkups when patient or tab changes
  useEffect(() => {
    const load = async () => {
      if (selectedPatient && activeTab === 'checkups') {
        try {
          const data = await getPatientCheckups(selectedPatient.id);
          setCheckups(Array.isArray(data) ? data : []);
        } catch {
          // silent for now
        }
      }
    };
    load();
  }, [selectedPatient, activeTab]);

  // Socket.IO real-time updates for checkups
  useEffect(() => {
    let currentRoom = null;
    let socket = null;

    const setupSocketIO = async () => {
      try {
        // Wait for Socket.IO connection to be established
        socket = await socketService.waitForConnection();
        
        // Clear previous checkup data when switching patients
        setCheckups([]);
        
        // Leave all patient-specific rooms first to avoid conflicts
        socketService.leaveAllPatientRooms();
        
        // Join patient-specific checkup room if a patient is selected
        if (selectedPatient) {
          const roomName = `patient-${selectedPatient.id}-checkups`;
          currentRoom = roomName;
          socketService.joinRoom(roomName);
          console.log(`🔌 Joined patient-specific checkup room: ${roomName}`);
        }
        
        // Listen for checkup updates
        const handleCheckupUpdate = (data) => {
          console.log('🔌 Real-time checkup update received:', data);
          console.log('🔌 Current room:', currentRoom);
          console.log('🔌 Selected patient ID:', selectedPatient?.id);
          
          // Double-check that this update is for the currently selected patient
          if (selectedPatient && data.checkup && data.checkup.patient_id === selectedPatient.id) {
            if (data.type === 'added') {
              // Add new checkup to the list, but check for duplicates first
              setCheckups(prevCheckups => {
                const exists = prevCheckups.some(checkup => checkup.id === data.checkup.id);
                if (exists) {
                  console.log('🔌 Duplicate checkup detected, ignoring:', data.checkup.id);
                  return prevCheckups;
                }
                console.log('🔌 Adding new checkup:', data.checkup.id, 'at', data.timestamp);
                return [...prevCheckups, data.checkup];
              });
              // Update total checkups count
              setTotalCheckups(prev => prev + 1);
            } else if (data.type === 'updated') {
              // Update existing checkup in the list
              setCheckups(prevCheckups => 
                prevCheckups.map(checkup => 
                  checkup.id === data.checkup.id ? data.checkup : checkup
                )
              );
            } else if (data.type === 'deleted') {
              // Remove deleted checkup from the list
              setCheckups(prevCheckups => 
                prevCheckups.filter(checkup => checkup.id !== data.checkup.id)
              );
              // Update total checkups count
              setTotalCheckups(prev => Math.max(0, prev - 1));
            }
          } else {
            console.log('🔌 Ignoring checkup update for different patient:', data.checkup?.patient_id);
          }
        };

        // Remove any existing listeners first
        socket.off('checkup-updated');
        socket.on('checkup-updated', handleCheckupUpdate);

        return () => {
          if (socket) {
            socket.off('checkup-updated', handleCheckupUpdate);
          }
          if (currentRoom) {
            socketService.leaveRoom(currentRoom);
            console.log(`🔌 Left patient-specific checkup room: ${currentRoom}`);
          }
        };
      } catch (error) {
        console.error('Failed to setup Socket.IO:', error);
      }
    };

    setupSocketIO();
  }, [selectedPatient]);

  // Socket.IO real-time updates for transactions
  useEffect(() => {
    let currentTransactionRoom = null;
    let socket = null;

    const setupTransactionSocketIO = async () => {
      try {
        // Wait for Socket.IO connection to be established
        socket = await socketService.waitForConnection();
        
        // Clear previous transaction data when switching patients
        setTransactions([]);
        
        // Leave all patient-specific rooms first to avoid conflicts
        socketService.leaveAllPatientRooms();
        
        // Join patient-specific transaction room if a patient is selected
        if (selectedPatient) {
          const roomName = `patient-${selectedPatient.id}-transactions`;
          currentTransactionRoom = roomName;
          socketService.joinRoom(roomName);
          console.log(`🔌 Joined patient-specific transaction room: ${roomName}`);
        }
        
        // Listen for transaction updates
        const handleTransactionUpdate = (data) => {
          console.log('🔌 Real-time transaction update received:', data);
          console.log('🔌 Event type:', data.type);
          console.log('🔌 Current room:', currentTransactionRoom);
          console.log('🔌 Selected patient ID:', selectedPatient?.id);
          
          // For deletion events, we don't have transaction data, so we process them directly
          if (data.type === 'deleted') {
            // Remove deleted transaction from the list
            console.log('🔌 Removing deleted transaction:', data.transaction_id);
            console.log('🔌 Deletion data:', data);
            setTransactions(prevTransactions => {
              const filtered = prevTransactions.filter(transaction => {
                // Convert both to numbers for comparison to handle string/number mismatch
                const transactionId = Number(transaction.id);
                const deletedId = Number(data.transaction_id);
                const shouldKeep = transactionId !== deletedId;
                console.log(`🔌 Transaction ${transactionId} vs deleted ${deletedId}: ${shouldKeep ? 'keep' : 'remove'}`);
                return shouldKeep;
              });
              console.log(`🔌 Transactions before: ${prevTransactions.length}, after: ${filtered.length}`);
              return filtered;
            });
          } else if (selectedPatient && data.transaction && data.transaction.patient_id === selectedPatient.id) {
            if (data.type === 'added') {
              // Add new transaction to the list, but check for duplicates first
              setTransactions(prevTransactions => {
                const exists = prevTransactions.some(transaction => transaction.id === data.transaction.id);
                if (exists) {
                  console.log('🔌 Duplicate transaction detected, ignoring:', data.transaction.id);
                  return prevTransactions;
                }
                console.log('🔌 Adding new transaction:', data.transaction.id, 'at', data.timestamp);
                return [data.transaction, ...prevTransactions];
              });
            } else if (data.type === 'updated') {
              // Update existing transaction in the list
              setTransactions(prevTransactions => 
                prevTransactions.map(transaction => 
                  transaction.id === data.transaction.id ? data.transaction : transaction
                )
              );
            } else if (data.type === 'item_fulfilled' || data.type === 'item_refunded') {
              // Refresh transactions for the currently selected patient
              if (selectedPatient) {
                const refreshTransactions = async () => {
                  try {
                    const data = await getTransactions();
                    const patientTransactions = (data || []).filter(transaction => 
                      transaction.patient_id === selectedPatient.id
                    );
                    setTransactions(patientTransactions);
                  } catch (err) {
                    console.error('Failed to refresh transactions:', err);
                  }
                };
                refreshTransactions();
              }
            }
          } else {
            console.log('🔌 Ignoring transaction update for different patient:', data.transaction?.patient_id);
          }
        };

        // Remove any existing listeners first
        socket.off('transaction-updated');
        socket.on('transaction-updated', handleTransactionUpdate);

        return () => {
          if (socket) {
            socket.off('transaction-updated', handleTransactionUpdate);
          }
          if (currentTransactionRoom) {
            socketService.leaveRoom(currentTransactionRoom);
            console.log(`🔌 Left patient-specific transaction room: ${currentTransactionRoom}`);
          }
        };
      } catch (error) {
        console.error('Failed to setup transaction Socket.IO:', error);
      }
    };

    setupTransactionSocketIO();
  }, [selectedPatient]);

  const normalizedQuery = (searchQuery || '').trim().toLowerCase();
  const filteredPatients = normalizedQuery
    ? patients.filter((p) => {
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim().toLowerCase();
        const idStr = String(p.id || '').toLowerCase();
        return name.includes(normalizedQuery) || idStr.includes(normalizedQuery);
      })
    : patients;

 

  // Limit suggestions for dropdown
  const suggestionPatients = filteredPatients.slice(0, 8);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add transaction state variables
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState(null);
  const [expandedTransactions, setExpandedTransactions] = useState(new Set());
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [transactionFormError, setTransactionFormError] = useState(null);
  
  // Pagination state for transactions
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10);
  
  // Refund modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundItem, setRefundItem] = useState(null);
  const [refundQuantity, setRefundQuantity] = useState(1);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  
  // Memoized callbacks for transaction actions
  const handleTransactionToggle = useCallback((transactionId) => {
    setExpandedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        // Limit to maximum 2 expanded transactions to prevent performance issues
        if (newSet.size >= 2) {
          // Remove the first (oldest) expanded transaction
          const firstExpanded = newSet.values().next().value;
          newSet.delete(firstExpanded);
        }
        newSet.add(transactionId);
      }
      return newSet;
    });
  }, []);


  const handleTransactionDelete = useCallback(async (transaction) => {
    setAlertConfig({
      isOpen: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      type: 'warning',
      onConfirm: async () => {
        try {
          await deleteTransaction(transaction.id);
          // The transaction will be removed from the list via Socket.IO real-time updates
          // No need to manually update the state here
          setAlertConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete transaction: ' + err.message,
            type: 'error',
            onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
            onCancel: null
          });
        }
      },
      onCancel: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
    });
  }, []);

  const handleItemFulfill = useCallback(async (item) => {
    try {
      await fulfillTransactionItem(item.id);
      // Refresh transactions to show updated status
      const data = await getTransactions();
      const patientTransactions = (data || []).filter(transaction => 
        transaction.patient_id === selectedPatient.id
      );
      setTransactions(patientTransactions);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: 'Error',
        message: 'Failed to fulfill item: ' + err.message,
        type: 'error',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
        onCancel: null
      });
    }
  }, [selectedPatient]);

  const handleItemRefund = useCallback((item) => {
    setRefundItem(item);
    setRefundQuantity(1);
    setIsRefundModalOpen(true);
  }, []);

  // Memoized pagination calculations
  const paginatedTransactions = useMemo(() => {
    const startIndex = (transactionCurrentPage - 1) * transactionsPerPage;
    return transactions.slice(startIndex, startIndex + transactionsPerPage);
  }, [transactions, transactionCurrentPage, transactionsPerPage]);

  const totalTransactionPages = Math.ceil(transactions.length / transactionsPerPage);

  // Reset pagination when transactions change
  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [transactions.length]);

  // Memoized pagination handlers
  const handlePreviousPage = useCallback(() => {
    setTransactionCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setTransactionCurrentPage(prev => Math.min(totalTransactionPages, prev + 1));
  }, [totalTransactionPages]);
  
  const initialTransactionForm = {
    receipt_number: '',
    transaction_date: '',
    amount: '',
    payment_method: '',
    transaction_type: '',
    description: ''
  };
  const [transactionForm, setTransactionForm] = useState(initialTransactionForm);

  // Load transactions when a patient is selected and transactions tab is active
  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedPatient && activeTab === 'transactions') {
        setTransactionsLoading(true);
        setTransactionsError(null);
        try {
          const data = await getTransactions();
          // Filter transactions for the selected patient
          const patientTransactions = (data || []).filter(transaction => 
            transaction.patient_id === selectedPatient.id
          );
          setTransactions(patientTransactions);
        } catch (err) {
          setTransactionsError(err.message || 'Failed to load transactions');
          console.error('Error fetching transactions:', err);
        } finally {
          setTransactionsLoading(false);
        }
      } else {
        // Clear transactions when no patient is selected or not on transactions tab
        setTransactions([]);
        setTransactionsError(null);
      }
    };
    
    fetchTransactions();
  }, [selectedPatient, activeTab]);

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
                <h1 className="text-2xl font-bold text-white">
                  {userRole === 'admin' ? 'Patient Management' : 'Patient Records'}
                </h1>
                <div className="ml-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-green-400">Live Updates</span>
                </div>
              </div>
              {(userRole === 'admin' || userRole === 'employee') && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200" onClick={() => { setForm({ first_name: '', middle_name: '', last_name: '', sex: '', birthdate: '', address: '', contact_number: '', telephone_number: '', senior_number: '' }); setFormError(null); setIsAddOpen(true); }}>
                  Add New Patient
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
          
          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-white">{totalPatients}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total checkups</p>
                  <p className="text-2xl font-bold text-white">{totalCheckups}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Patients this Month</p>
                  <p className="text-2xl font-bold text-white">{thisMonthCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patients Workspace: Left profile + Right tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: patient selector + profile */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
                <div className="mb-4 relative" ref={searchInputRef}>
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsSuggestionsOpen(true); }}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isSuggestionsOpen && (
                    <div
                      ref={suggestionsRef}
                      className="absolute left-0 right-0 mt-2 bg-gray-900/95 border border-gray-700 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-gray-800"
                    >
                      {loading && (
                        <div className="px-3 py-3 text-sm text-gray-400">Loading patients...</div>
                      )}
                      {error && !loading && (
                        <div className="px-3 py-3 text-sm text-red-400">{error}</div>
                      )}
                      {!loading && !error && suggestionPatients.length === 0 && (
                        <div className="px-3 py-3 text-sm text-gray-400">No patients found</div>
                      )}
                      {!loading && !error && suggestionPatients.map((p) => {
                        const displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || `Patient ${p.id}`;
                        const initials = `${(p.first_name?.[0] || '')}${(p.last_name?.[0] || '')}`.toUpperCase() || 'P';
                        const isActive = selectedPatient?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              const phone = p.contact_number || p.telephone_number || '—';
                              const birthdate = formatDateYMD(p.birthdate);
                              setSelectedPatient({ ...p, displayName, phone, birthdate, status: p.status || 'Active' });
                              setIsSuggestionsOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-gray-800 ${isActive ? 'bg-gray-800/70' : ''}`}
                          >
                            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{initials}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{displayName}</div>
                              <div className="text-xs text-gray-400">ID: {p.id}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="mt-5 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{(selectedPatient.displayName || '').split(' ').map(n => n[0]).join('')}</span>
                      </div>
                        <div>
                          <div className="text-white font-semibold text-base">
                            {selectedPatient.displayName}
                          </div>
                          <div className="text-gray-300 text-sm">
                            Age: {selectedPatient.age}
                          </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                     
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs uppercase">Birthdate</p>
                        <p className="text-white mt-1">{selectedPatient.birthdate || selectedPatient.birthdate === '' ? selectedPatient.birthdate : '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs uppercase">Contact</p>
                        <p className="text-white mt-1">{selectedPatient.phone || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs uppercase">Telephone</p>
                        <p className="text-white mt-1">{selectedPatient.telephone_number || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs uppercase">Address</p>
                        <p className="text-white mt-1">{selectedPatient.address || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs uppercase">Senior Number</p>
                        <p className="text-white mt-1">{selectedPatient.senior_number || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Added by</p>
                        <p className="text-white mt-1">{selectedPatient.created_by_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Date Added</p>
                        <p className="text-white mt-1">{formatDateYMDSlash(selectedPatient.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: navbar tabs and content */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl">
                <div className="border-b border-gray-700 px-4">
                  <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {[
                      { key: 'checkups', label: 'Checkups' },
                      { key: 'transactions', label: 'Transactions' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`py-4 text-sm font-medium border-b-2 ${activeTab === tab.key ? 'text-blue-400 border-blue-500' : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="p-6 min-h-[22rem]">
                  {!selectedPatient && (
                    <div className="text-gray-400 text-sm">Select a patient to view details.</div>
                  )}
                  {selectedPatient && activeTab === 'checkups' && (
                    <div className="text-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Checkups</h3>
                        {userRole === 'admin' && (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm"
                            onClick={() => { 
                              setCheckupForm(initialCheckupForm); 
                              setCheckupFormError(null); 
                              setIsEditMode(false);
                              setEditingCheckupId(null);
                              setIsAddCheckupOpen(true); 
                            }}
                          >
                            Add Checkup
                          </button>
                        )}
                      </div>
                      {(!checkups || checkups.length === 0) ? (
                        <p className="text-gray-400 text-sm">No checkups yet.</p>
                      ) : (
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                          {checkups.map(c => (
                            <div key={c.id} className="bg-gray-900/60 border border-gray-700 rounded-lg">
                              <div className="flex items-center justify-between px-4 py-3">
                                <button
                                  className="flex-1 flex items-center justify-between text-left hover:bg-gray-800/60"
                                  onClick={() => setExpandedCheckups(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className={'inline-block w-4 h-4 text-gray-300 transform transition-transform ' + (expandedCheckups[c.id] ? 'rotate-90' : '')}>▶</span>
                                    <div className="text-white font-medium text-sm">{formatDateYMDSlash(c.checkup_date) || '—'}</div>
                                  </div>
                                  <div className="text-gray-400 text-xs">By: {c.created_by_name || '—'}</div>
                                </button>
                                <div className="flex items-center gap-1">
                                  {userRole === 'admin' && (
                                    <>
                                      <button
                                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          // Prepare form data for editing
                                          const editForm = {
                                            checkup_date: c.checkup_date ? formatDateYMD(c.checkup_date) : '',
                                            notes: c.notes || '',
                                            diagnosis: c.diagnosis || '',
                                            binocular_pd: c.binocular_pd || '',
                                            spectacle: {
                                              sphereRight: c.spectacle_prescription?.sphereRight || '',
                                              cylinderRight: c.spectacle_prescription?.cylinderRight || '',
                                              axisRight: c.spectacle_prescription?.axisRight || '',
                                              additionRight: c.spectacle_prescription?.additionRight || '',
                                              visualAcuityRight: c.spectacle_prescription?.visualAcuityRight || '',
                                              monocularPdRight: c.spectacle_prescription?.monocularPdRight || '',
                                              sphereLeft: c.spectacle_prescription?.sphereLeft || '',
                                              cylinderLeft: c.spectacle_prescription?.cylinderLeft || '',
                                              axisLeft: c.spectacle_prescription?.axisLeft || '',
                                              additionLeft: c.spectacle_prescription?.additionLeft || '',
                                              visualAcuityLeft: c.spectacle_prescription?.visualAcuityLeft || '',
                                              monocularPdLeft: c.spectacle_prescription?.monocularPdLeft || ''
                                            },
                                            contact: {
                                              sphereRight: c.contact_lens_prescription?.sphereRight || '',
                                              sphereLeft: c.contact_lens_prescription?.sphereLeft || '',
                                              cylinderRight: c.contact_lens_prescription?.cylinderRight || '',
                                              cylinderLeft: c.contact_lens_prescription?.cylinderLeft || '',
                                              axisRight: c.contact_lens_prescription?.axisRight || '',
                                              axisLeft: c.contact_lens_prescription?.axisLeft || '',
                                              additionRight: c.contact_lens_prescription?.additionRight || '',
                                              additionLeft: c.contact_lens_prescription?.additionLeft || '',
                                              baseCurveRight: c.contact_lens_prescription?.baseCurveRight || '',
                                              baseCurveLeft: c.contact_lens_prescription?.baseCurveLeft || '',
                                              diameterRight: c.contact_lens_prescription?.diameterRight || '',
                                              diameterLeft: c.contact_lens_prescription?.diameterLeft || ''
                                            }
                                          };
                                          setCheckupForm(editForm);
                                          setEditingCheckupId(c.id);
                                          setIsEditMode(true);
                                          setCheckupFormError(null);
                                          setIsAddCheckupOpen(true);
                                        }}
                                        title="Edit checkup"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                         setAlertConfig({
                                           isOpen: true,
                                           title: 'Delete Checkup',
                                           message: 'Are you sure you want to delete this checkup? This action cannot be undone.',
                                           type: 'warning',
                                           onConfirm: async () => {
                                             try {
                                               await deleteCheckupApi(c.id);
                                               // Remove this manual refresh - Socket.IO will handle it
                                               setAlertConfig(prev => ({ ...prev, isOpen: false }));
                                             } catch (err) {
                                               setAlertConfig({
                                                 isOpen: true,
                                                 title: 'Error',
                                                 message: 'Failed to delete checkup: ' + err.message,
                                                 type: 'error',
                                                 onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                                                 onCancel: null
                                               });
                                             }
                                           },
                                           onCancel: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
                                         });
                                       }}
                                       title="Delete checkup"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className={`${expandedCheckups[c.id] ? 'block' : 'hidden'} px-4 pb-4`}>
                                <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <div className="text-gray-400 text-xs uppercase">Diagnosis</div>
                                    <div className="text-white">{c.diagnosis || '—'}</div>
                                        </div>
                                  <div>
                                    <div className="text-gray-400 text-xs uppercase">Notes</div>
                                    <div className="text-white">{c.notes || '—'}</div>
                                        </div>
                                  <div>
                                    <div className="text-gray-400 text-xs uppercase">Binocular PD</div>
                                    <div className="text-white">{c.binocular_pd || '—'}</div>
                                      </div>
                                    </div>

                              {/* Spectacle Prescription Table */}
                              {c.spectacle_prescription && (
                                <div className="mt-3">
                                  <div className="text-gray-300 text-sm font-medium mb-2">Spectacle</div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-left border border-gray-700">
                                      <thead className="bg-gray-900/70">
                                        <tr>
                                          <th className="px-3 py-2 border-b border-gray-700">Eye</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Sphere</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Cylinder</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Axis</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Addition</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Visual acuity</th>
                                          <th className="px-3 py-2 border-b border-gray-700">MPD</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr className="odd:bg-gray-800/40">
                                          <td className="px-3 py-2 border-t border-gray-700 text-gray-300">Right Eye</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.sphereRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.cylinderRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.axisRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.additionRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.visualAcuityRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.monocularPdRight ?? '—'}</td>
                                        </tr>
                                        <tr className="odd:bg-gray-800/40">
                                          <td className="px-3 py-2 border-t border-gray-700 text-gray-300">Left Eye</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.sphereLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.cylinderLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.axisLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.additionLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.visualAcuityLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.spectacle_prescription.monocularPdLeft ?? '—'}</td>
                                        </tr>
                                        <tr>
                                          <td className="px-3 py-2 border-t border-gray-700 text-gray-300">BPD</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white" colSpan={6}>{c.binocular_pd ?? '—'}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                        </div>
                                          </div>
                                        )}

                              {/* Contact Lens Prescription Table */}
                              {c.contact_lens_prescription && (
                                <div className="mt-3">
                                  <div className="text-gray-300 text-sm font-medium mb-2">Contact Lens</div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-left border border-gray-700">
                                      <thead className="bg-gray-900/70">
                                        <tr>
                                          <th className="px-3 py-2 border-b border-gray-700">Eye</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Sphere</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Cylinder</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Axis</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Addition</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Base Curve</th>
                                          <th className="px-3 py-2 border-b border-gray-700">Diameter</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr className="odd:bg-gray-800/40">
                                          <td className="px-3 py-2 border-t border-gray-700 text-gray-300">Right Eye</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.sphereRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.cylinderRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.axisRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.additionRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.baseCurveRight ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.diameterRight ?? '—'}</td>
                                        </tr>
                                        <tr className="odd:bg-gray-800/40">
                                          <td className="px-3 py-2 border-t border-gray-700 text-gray-300">Left Eye</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.sphereLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.cylinderLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.axisLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.additionLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.baseCurveLeft ?? '—'}</td>
                                          <td className="px-3 py-2 border-t border-gray-700 text-white">{c.contact_lens_prescription.diameterLeft ?? '—'}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                                    </div>
                                                    </div>
                                                      )}
                                                    </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPatient && activeTab === 'transactions' && (
                    <div className="text-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">Transactions</h3>
                        {(userRole === 'admin' || userRole === 'employee') && (
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm"
                            onClick={() => { 
                              setTransactionForm(initialTransactionForm); 
                              setTransactionFormError(null); 
                              setIsAddTransactionOpen(true); 
                            }}
                          >
                            Add Transaction
                          </button>
                        )}
                      </div>
                      {transactionsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-gray-400 text-sm">Loading transactions...</div>
                        </div>
                      ) : transactionsError ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-red-400 text-sm">Error: {transactionsError}</div>
                        </div>
                      ) : (!transactions || transactions.length === 0) ? (
                        <p className="text-gray-400 text-sm">No transactions yet.</p>
                      ) : (
                        <>
                          <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                            {paginatedTransactions.map(t => (
                              <TransactionItem
                                key={t.id}
                                transaction={t}
                                isExpanded={expandedTransactions.has(t.id)}
                                onToggle={() => handleTransactionToggle(t.id)}
                                onDelete={(e) => {
                                  e.stopPropagation();
                                  handleTransactionDelete(t);
                                }}
                                onFulfill={handleItemFulfill}
                                onRefund={handleItemRefund}
                                userRole={userRole}
                                formatDateYMDSlash={formatDateYMDSlash}
                              />
                            ))}
                          </div>
                          
                          {/* Pagination Controls */}
                          {totalTransactionPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                              <div className="text-sm text-gray-400">
                                Showing {((transactionCurrentPage - 1) * transactionsPerPage) + 1} to {Math.min(transactionCurrentPage * transactionsPerPage, transactions.length)} of {transactions.length} transactions
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handlePreviousPage}
                                  disabled={transactionCurrentPage === 1}
                                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors duration-200"
                                >
                                  Previous
                                </button>
                                <span className="text-sm text-gray-300">
                                  Page {transactionCurrentPage} of {totalTransactionPages}
                                </span>
                                <button
                                  onClick={handleNextPage}
                                  disabled={transactionCurrentPage === totalTransactionPages}
                                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors duration-200"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          </div>

         

          {/* Add Patient Modal */}
          <AddPatientModal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            form={form}
            setForm={setForm}
            formError={formError}
            isSubmitting={isSubmitting}
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError(null);
              setIsSubmitting(true);
              try {
                const payload = {
                  ...form,
                  birthdate: form.birthdate || ''
                };
                await addPatientApi(payload);
                const data = await fetchPatientsApi();
                setPatients(data || []);
                setIsAddOpen(false);
              } catch (err) {
                setFormError(err.message || 'Failed to add patient');
              } finally {
                setIsSubmitting(false);
              }
            }}
          />

          {/* Add Checkup Modal */}
          <AddCheckupModal
            isOpen={isAddCheckupOpen}
            onClose={() => { 
              setIsAddCheckupOpen(false); 
              setIsEditMode(false); 
              setEditingCheckupId(null); 
              setCheckupForm(initialCheckupForm); 
            }}
            checkupForm={checkupForm}
            setCheckupForm={setCheckupForm}
            checkupFormError={checkupFormError}
            isSavingCheckup={isSavingCheckup}
            mode={isEditMode ? 'edit' : 'add'}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedPatient) return;
              setCheckupFormError(null);
              setIsSavingCheckup(true);
              try {
                const payload = {
                  checkup_date: checkupForm.checkup_date || null,
                  notes: checkupForm.notes || null,
                  diagnosis: checkupForm.diagnosis || null,
                  binocular_pd: checkupForm.binocular_pd || null,
                  spectacle_prescription: {
                    sphereRight: checkupForm.spectacle.sphereRight || null,
                    cylinderRight: checkupForm.spectacle.cylinderRight || null,
                    axisRight: checkupForm.spectacle.axisRight || null,
                    additionRight: checkupForm.spectacle.additionRight || null,
                    visualAcuityRight: checkupForm.spectacle.visualAcuityRight || null,
                    monocularPdRight: checkupForm.spectacle.monocularPdRight || null,
                    sphereLeft: checkupForm.spectacle.sphereLeft || null,
                    cylinderLeft: checkupForm.spectacle.cylinderLeft || null,
                    axisLeft: checkupForm.spectacle.axisLeft || null,
                    additionLeft: checkupForm.spectacle.additionLeft || null,
                    visualAcuityLeft: checkupForm.spectacle.visualAcuityLeft || null,
                    monocularPdLeft: checkupForm.spectacle.monocularPdLeft || null
                  },
                  contact_lens_prescription: {
                    sphereRight: checkupForm.contact.sphereRight || null,
                    sphereLeft: checkupForm.contact.sphereLeft || null,
                    cylinderRight: checkupForm.contact.cylinderRight || null,
                    cylinderLeft: checkupForm.contact.cylinderLeft || null,
                    axisRight: checkupForm.contact.axisRight || null,
                    axisLeft: checkupForm.contact.axisLeft || null,
                    additionRight: checkupForm.contact.additionRight || null,
                    additionLeft: checkupForm.contact.additionLeft || null,
                    baseCurveRight: checkupForm.contact.baseCurveRight || null,
                    baseCurveLeft: checkupForm.contact.baseCurveLeft || null,
                    diameterRight: checkupForm.contact.diameterRight || null,
                    diameterLeft: checkupForm.contact.diameterLeft || null
                  }
                };
                if (isEditMode && editingCheckupId) {
                  await updateCheckupApi(editingCheckupId, payload);
                } else {
                  await addCheckupApi(selectedPatient.id, payload);
                }
                // Remove this manual refresh - Socket.IO will handle it
                // const data = await getPatientCheckups(selectedPatient.id);
                // setCheckups(Array.isArray(data) ? data : []);
                setIsAddCheckupOpen(false);
                setIsEditMode(false);
                setEditingCheckupId(null);
              } catch (err) {
                setCheckupFormError(err.message || (isEditMode ? 'Failed to update checkup' : 'Failed to add checkup'));
              } finally {
                setIsSavingCheckup(false);
              }
            }}
                     />

          {/* Add Transaction Modal */}
          <AddTransactionModal
            isOpen={isAddTransactionOpen}
            onClose={() => { 
              setIsAddTransactionOpen(false); 
              setTransactionForm(initialTransactionForm);
              setTransactionFormError(null); // Clear error when closing modal
            }}
            transactionForm={transactionForm}
            setTransactionForm={setTransactionForm}
            transactionFormError={transactionFormError}
            isSavingTransaction={isSavingTransaction}
            selectedPatient={selectedPatient}
            onClearError={() => setTransactionFormError(null)}
            onSubmit={async (e, transactionData) => {
              e.preventDefault();
              if (!selectedPatient) return;
              setTransactionFormError(null);
              setIsSavingTransaction(true);
              try {
                // Get user ID from localStorage (assuming it's stored there)
                const userId = localStorage.getItem('userId');
                if (!userId) {
                  throw new Error('User not authenticated');
                }

                // Prepare transaction data for API
                const apiTransactionData = {
                  user_id: parseInt(userId),
                  patient_id: selectedPatient.id,
                  receipt_number: transactionData.receipt_number,
                  items: transactionData.items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    discount: item.discount || 0
                  })),
                  discount_percent: transactionData.overall_discount || 0
                };

                // Create new transaction via API
                await createTransaction(apiTransactionData);
                
                // Socket.IO will handle adding the transaction to the list automatically
                // No need to manually update the state here
                
                setIsAddTransactionOpen(false);
                setTransactionForm(initialTransactionForm);
                
                // Show success message
                setAlertConfig({
                  isOpen: true,
                  title: 'Success',
                  message: 'Transaction created successfully!',
                  type: 'success',
                  onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                  onCancel: null
                });
              } catch (err) {
                setTransactionFormError(err.message || 'Failed to save transaction');
                console.error('Transaction error:', err);
              } finally {
                setIsSavingTransaction(false);
              }
            }}
          />

          {/* Refund Modal */}
          {isRefundModalOpen && refundItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setIsRefundModalOpen(false)}></div>
              <div className="relative w-full max-w-md mx-4 shadow-2xl">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14v-5a2 2 0 00-2-2H6a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Refund Item</h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-300 mb-2">
                      <strong>Product:</strong> {refundItem.product_description || refundItem.product_code || 'Unknown Product'}
                    </p>
                    <p className="text-gray-300 mb-2">
                      <strong>Total Quantity:</strong> {refundItem.quantity}
                    </p>
                    {refundItem.refunded_quantity > 0 && (
                      <p className="text-orange-400 mb-2">
                        <strong>Already Refunded:</strong> {refundItem.refunded_quantity}
                      </p>
                    )}
                    <p className="text-gray-300 mb-4">
                      <strong>Available for Refund:</strong> {refundItem.quantity - (refundItem.refunded_quantity || 0)}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Refund Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={refundItem.quantity - (refundItem.refunded_quantity || 0)}
                      value={refundQuantity}
                      onChange={(e) => setRefundQuantity(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                      onClick={() => setIsRefundModalOpen(false)}
                      disabled={isProcessingRefund}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                      onClick={async () => {
                        if (!refundQuantity || refundQuantity <= 0) {
                          setAlertConfig({
                            isOpen: true,
                            title: 'Invalid Input',
                            message: 'Please enter a valid refund quantity',
                            type: 'warning',
                            onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                            onCancel: null
                          });
                          return;
                        }
                        
                        if (refundQuantity > (refundItem.quantity - (refundItem.refunded_quantity || 0))) {
                          setAlertConfig({
                            isOpen: true,
                            title: 'Invalid Input',
                            message: 'Refund quantity cannot exceed available quantity',
                            type: 'warning',
                            onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                            onCancel: null
                          });
                          return;
                        }

                        setIsProcessingRefund(true);
                        try {
                          await refundTransactionItem(refundItem.id, refundQuantity);
                          // Refresh transactions to show updated status
                          const data = await getTransactions();
                          const patientTransactions = (data || []).filter(transaction => 
                            transaction.patient_id === selectedPatient.id
                          );
                          setTransactions(patientTransactions);
                          setIsRefundModalOpen(false);
                          setAlertConfig({
                            isOpen: true,
                            title: 'Success',
                            message: 'Item refunded successfully!',
                            type: 'success',
                            onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                            onCancel: null
                          });
                        } catch (err) {
                          setAlertConfig({
                            isOpen: true,
                            title: 'Error',
                            message: 'Failed to refund item: ' + err.message,
                            type: 'error',
                            onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false })),
                            onCancel: null
                          });
                        } finally {
                          setIsProcessingRefund(false);
                        }
                      }}
                      disabled={isProcessingRefund}
                    >
                      {isProcessingRefund ? 'Processing...' : 'Refund Item'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Alert Modal */}
          <Alert
            isOpen={alertConfig.isOpen}
            title={alertConfig.title}
            message={alertConfig.message}
            type={alertConfig.type}
            onConfirm={alertConfig.onConfirm}
            onCancel={alertConfig.onCancel}
            showCancel={!!alertConfig.onCancel}
            confirmText={alertConfig.type === 'error' ? 'OK' : 'Confirm'}
          />
         </main>
       </div>
     </div>
   );
 }

export default Patients;
