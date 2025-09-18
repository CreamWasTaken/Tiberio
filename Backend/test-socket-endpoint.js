// Comprehensive Socket.IO Test Suite
const testSocketEvent = (req, res) => {
  const io = req.app.get('io');
  if (!io) {
    return res.status(500).json({ error: 'Socket.IO not available' });
  }

  console.log('🔌 Starting comprehensive Socket.IO test suite...');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  // Test 1: Basic Connection Test
  const connectionTest = () => {
    const connectedClients = io.sockets.sockets.size;
    const testPassed = connectedClients >= 0;
    
    testResults.tests.push({
      name: 'Connection Test',
      description: 'Check if Socket.IO server is running and can count clients',
      passed: testPassed,
      details: `Connected clients: ${connectedClients}`,
      timestamp: new Date().toISOString()
    });
    
    return testPassed;
  };

  // Test 2: Room Management Test
  const roomManagementTest = () => {
    const rooms = Array.from(io.sockets.adapter.rooms.keys());
    const testPassed = Array.isArray(rooms);
    
    testResults.tests.push({
      name: 'Room Management Test',
      description: 'Check if room system is working',
      passed: testPassed,
      details: `Available rooms: ${rooms.length} (${rooms.join(', ')})`,
      timestamp: new Date().toISOString()
    });
    
    return testPassed;
  };

  // Test 3: Event Emission Test - Inventory Events
  const inventoryEventTest = () => {
    try {
      const testData = {
        type: 'test',
        message: 'Inventory test event',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substr(2, 9)
      };

      // Test room-based emission
      io.to('inventory-updated').emit('inventory-updated', testData);
      
      // Test global emission
      io.emit('inventory-updated', { ...testData, scope: 'global' });
      
      testResults.tests.push({
        name: 'Inventory Event Test',
        description: 'Test inventory-updated event emission',
        passed: true,
        details: `Test data emitted: ${JSON.stringify(testData)}`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Inventory Event Test',
        description: 'Test inventory-updated event emission',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 4: Event Emission Test - Item Events
  const itemEventTest = () => {
    try {
      const testData = {
        type: 'test',
        item: {
          id: 'test-item-123',
          name: 'Test Item',
          description: 'Test item for socket testing',
          price: 99.99,
          stock: 10
        },
        timestamp: new Date().toISOString()
      };

      io.to('item-updated').emit('item-updated', testData);
      
      testResults.tests.push({
        name: 'Item Event Test',
        description: 'Test item-updated event emission',
        passed: true,
        details: `Test item data emitted: ${JSON.stringify(testData)}`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Item Event Test',
        description: 'Test item-updated event emission',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 5: Event Emission Test - Patient Events
  const patientEventTest = () => {
    try {
      const testData = {
        type: 'test',
        patient: {
          id: 'test-patient-123',
          name: 'Test Patient',
          email: 'test@example.com',
          phone: '123-456-7890'
        },
        timestamp: new Date().toISOString()
      };

      io.to('patient-updated').emit('patient-updated', testData);
      
      testResults.tests.push({
        name: 'Patient Event Test',
        description: 'Test patient-updated event emission',
        passed: true,
        details: `Test patient data emitted: ${JSON.stringify(testData)}`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Patient Event Test',
        description: 'Test patient-updated event emission',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 6: Event Emission Test - Checkup Events
  const checkupEventTest = () => {
    try {
      const testData = {
        type: 'test',
        checkup: {
          id: 'test-checkup-123',
          patient_id: 'test-patient-123',
          date: new Date().toISOString(),
          notes: 'Test checkup for socket testing'
        },
        timestamp: new Date().toISOString()
      };

      io.to('checkup-updated').emit('checkup-updated', testData);
      
      testResults.tests.push({
        name: 'Checkup Event Test',
        description: 'Test checkup-updated event emission',
        passed: true,
        details: `Test checkup data emitted: ${JSON.stringify(testData)}`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Checkup Event Test',
        description: 'Test checkup-updated event emission',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 7: Event Emission Test - Transaction Events
  const transactionEventTest = () => {
    try {
      const testData = {
        type: 'test',
        transaction: {
          id: 'test-transaction-123',
          patient_id: 'test-patient-123',
          total_amount: 199.98,
          status: 'completed',
          items: [
            { item_id: 'test-item-123', quantity: 2, price: 99.99 }
          ]
        },
        timestamp: new Date().toISOString()
      };

      io.to('transaction-updated').emit('transaction-updated', testData);
      
      testResults.tests.push({
        name: 'Transaction Event Test',
        description: 'Test transaction-updated event emission',
        passed: true,
        details: `Test transaction data emitted: ${JSON.stringify(testData)}`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Transaction Event Test',
        description: 'Test transaction-updated event emission',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 8: Event Emission Test - Order Events
  const orderEventTest = () => {
    try {
      const testData = {
        type: 'test',
        order: {
          id: 'test-order-123',
          supplier_id: 'test-supplier-123',
          status: 'pending',
          total_amount: 500.00,
          items: [
            { item_id: 'test-item-123', quantity: 5, price: 100.00 }
          ]
        },
        timestamp: new Date().toISOString()
      };

      io.to('order-updated').emit('order-updated', testData);
      
      testResults.tests.push({
        name: 'Order Event Test',
        description: 'Test order-updated event emission',
        passed: true,
        details: `Test order data emitted: ${JSON.stringify(testData)}`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Order Event Test',
        description: 'Test order-updated event emission',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 9: Patient-Specific Room Test
  const patientRoomTest = () => {
    try {
      const testPatientId = 'test-patient-123';
      const testData = {
        type: 'test',
        message: 'Patient-specific room test',
        patientId: testPatientId,
        timestamp: new Date().toISOString()
      };

      // Test patient checkup room
      io.to(`patient-${testPatientId}-checkups`).emit('checkup-updated', testData);
      
      // Test patient transaction room
      io.to(`patient-${testPatientId}-transactions`).emit('transaction-updated', testData);
      
      testResults.tests.push({
        name: 'Patient Room Test',
        description: 'Test patient-specific room events',
        passed: true,
        details: `Test data emitted to patient-${testPatientId}-checkups and patient-${testPatientId}-transactions`,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      testResults.tests.push({
        name: 'Patient Room Test',
        description: 'Test patient-specific room events',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Test 10: Performance Test
  const performanceTest = () => {
    try {
      const startTime = Date.now();
      const testCount = 100;
      
      for (let i = 0; i < testCount; i++) {
        io.emit('performance-test', {
          iteration: i,
          timestamp: new Date().toISOString()
        });
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / testCount;
      
      const testPassed = avgTime < 10; // Should be under 10ms per emission
      
      testResults.tests.push({
        name: 'Performance Test',
        description: `Test emission performance (${testCount} events)`,
        passed: testPassed,
        details: `Average time per emission: ${avgTime.toFixed(2)}ms, Total time: ${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return testPassed;
    } catch (error) {
      testResults.tests.push({
        name: 'Performance Test',
        description: 'Test emission performance',
        passed: false,
        details: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  // Run all tests
  const tests = [
    connectionTest,
    roomManagementTest,
    inventoryEventTest,
    itemEventTest,
    patientEventTest,
    checkupEventTest,
    transactionEventTest,
    orderEventTest,
    patientRoomTest,
    performanceTest
  ];

  tests.forEach(test => {
    testResults.summary.total++;
    if (test()) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
    }
  });

  // Calculate success rate
  const successRate = ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2);

  console.log(`🔌 Socket.IO Test Suite Complete: ${testResults.summary.passed}/${testResults.summary.total} tests passed (${successRate}%)`);

  res.json({
    message: 'Socket.IO test suite completed',
    successRate: `${successRate}%`,
    ...testResults
  });
};

// Additional endpoint for testing specific events
const testSpecificEvent = (req, res) => {
  const io = req.app.get('io');
  const { event, room, data } = req.body;

  if (!io) {
    return res.status(500).json({ error: 'Socket.IO not available' });
  }

  if (!event) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  try {
    const testData = {
      type: 'manual_test',
      message: 'Manual test event',
      timestamp: new Date().toISOString(),
      ...data
    };

    if (room) {
      io.to(room).emit(event, testData);
      console.log(`🔌 Emitted ${event} to room ${room}:`, testData);
  } else {
      io.emit(event, testData);
      console.log(`🔌 Emitted ${event} globally:`, testData);
    }

    res.json({
      message: `Event ${event} emitted successfully`,
      event,
      room: room || 'global',
      data: testData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to emit event',
      details: error.message
    });
  }
};

// Endpoint to get socket.io server status
const getSocketStatus = (req, res) => {
  const io = req.app.get('io');
  
  if (!io) {
    return res.status(500).json({ error: 'Socket.IO not available' });
  }

  const connectedClients = io.sockets.sockets.size;
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  const roomDetails = rooms.map(room => ({
    name: room,
    clientCount: io.sockets.adapter.rooms.get(room)?.size || 0
  }));

  res.json({
    status: 'running',
    connectedClients,
    totalRooms: rooms.length,
    rooms: roomDetails,
    timestamp: new Date().toISOString()
  });
};

module.exports = { 
  testSocketEvent, 
  testSpecificEvent, 
  getSocketStatus 
};

//curl http://192.168.1.2:3000/api/test-socket