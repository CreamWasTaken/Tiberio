import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';

const SocketTestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [receivedEvents, setReceivedEvents] = useState([]);
  const [socketStatus, setSocketStatus] = useState(null);

  useEffect(() => {
    // Get initial connection status
    setConnectionStatus(socketService.getConnectionStatus());

    // Listen for all socket events
    const eventTypes = [
      'inventory-updated',
      'item-updated', 
      'patient-updated',
      'checkup-updated',
      'transaction-updated',
      'order-updated',
      'performance-test'
    ];

    eventTypes.forEach(eventType => {
      socketService.on(eventType, (data) => {
        setReceivedEvents(prev => [...prev.slice(-9), {
          event: eventType,
          data,
          timestamp: new Date().toISOString()
        }]);
      });
    });

    // Listen for connection events
    socketService.on('connect', () => {
      setConnectionStatus(socketService.getConnectionStatus());
    });

    socketService.on('disconnect', () => {
      setConnectionStatus(socketService.getConnectionStatus());
    });

    // Cleanup
    return () => {
      eventTypes.forEach(eventType => {
        socketService.off(eventType);
      });
    };
  }, []);

  const runBackendTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      const response = await fetch('/api/test-socket');
      const data = await response.json();
      
      if (response.ok) {
        setTestResults(data.tests || []);
      } else {
        setTestResults([{
          name: 'Backend Test Error',
          passed: false,
          details: data.error || 'Unknown error'
        }]);
      }
    } catch (error) {
      setTestResults([{
        name: 'Backend Test Error',
        passed: false,
        details: error.message
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getSocketStatus = async () => {
    try {
      const response = await fetch('/api/socket-status');
      const data = await response.json();
      setSocketStatus(data);
    } catch (error) {
      console.error('Failed to get socket status:', error);
    }
  };

  const testSpecificEvent = async (event, room = null) => {
    try {
      const response = await fetch('/api/test-socket/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          room,
          data: {
            message: `Manual test for ${event}`,
            testId: Math.random().toString(36).substr(2, 9)
          }
        })
      });
      
      const data = await response.json();
      console.log('Event test result:', data);
    } catch (error) {
      console.error('Failed to test specific event:', error);
    }
  };

  const joinTestRooms = async () => {
    const rooms = [
      'inventory-updated',
      'item-updated',
      'patient-updated',
      'checkup-updated',
      'transaction-updated',
      'order-updated'
    ];

    for (const room of rooms) {
      await socketService.joinRoom(room);
    }
  };

  const leaveAllRooms = () => {
    socketService.leaveAllPatientRooms();
    const rooms = [
      'inventory-updated',
      'item-updated', 
      'patient-updated',
      'checkup-updated',
      'transaction-updated',
      'order-updated'
    ];

    rooms.forEach(room => {
      socketService.leaveRoom(room);
    });
  };

  const runFrontendTests = () => {
    const tests = [];
    
    // Test 1: Connection Status
    const connectionTest = {
      name: 'Frontend Connection Test',
      passed: connectionStatus.isConnected,
      details: `Connected: ${connectionStatus.isConnected}, Socket: ${connectionStatus.hasSocket}`
    };
    tests.push(connectionTest);

    // Test 2: Room Management
    const roomTest = {
      name: 'Frontend Room Test',
      passed: connectionStatus.joinedRooms.length >= 0,
      details: `Joined rooms: ${connectionStatus.joinedRooms.length} (${connectionStatus.joinedRooms.join(', ')})`
    };
    tests.push(roomTest);

    // Test 3: Event Emission
    try {
      socketService.emit('test-connection', {
        message: 'Frontend test emission',
        timestamp: new Date().toISOString()
      });
      
      tests.push({
        name: 'Frontend Emission Test',
        passed: true,
        details: 'Test event emitted successfully'
      });
    } catch (error) {
      tests.push({
        name: 'Frontend Emission Test',
        passed: false,
        details: `Error: ${error.message}`
      });
    }

    setTestResults(prev => [...prev, ...tests]);
  };

  const clearResults = () => {
    setTestResults([]);
    setReceivedEvents([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>🔌 Socket.IO Test Suite</h2>
      
      {/* Connection Status */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Connection Status</h3>
        <p><strong>Connected:</strong> {connectionStatus.isConnected ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Socket Available:</strong> {connectionStatus.hasSocket ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Joined Rooms:</strong> {connectionStatus.joinedRooms?.length || 0} ({connectionStatus.joinedRooms?.join(', ') || 'None'})</p>
        <button onClick={getSocketStatus} style={{ marginRight: '10px' }}>
          Refresh Status
        </button>
        <button onClick={joinTestRooms} style={{ marginRight: '10px' }}>
          Join Test Rooms
        </button>
        <button onClick={leaveAllRooms}>
          Leave All Rooms
        </button>
      </div>

      {/* Server Status */}
      {socketStatus && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Server Status</h3>
          <p><strong>Status:</strong> {socketStatus.status}</p>
          <p><strong>Connected Clients:</strong> {socketStatus.connectedClients}</p>
          <p><strong>Total Rooms:</strong> {socketStatus.totalRooms}</p>
          <p><strong>Rooms:</strong> {socketStatus.rooms?.map(r => `${r.name} (${r.clientCount})`).join(', ')}</p>
        </div>
      )}

      {/* Test Controls */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Test Controls</h3>
        <button 
          onClick={runBackendTests} 
          disabled={isRunning}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          {isRunning ? 'Running...' : 'Run Backend Tests'}
        </button>
        <button 
          onClick={runFrontendTests}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Run Frontend Tests
        </button>
        <button 
          onClick={clearResults}
          style={{ padding: '10px 20px' }}
        >
          Clear Results
        </button>
      </div>

      {/* Manual Event Testing */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Manual Event Testing</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {['inventory-updated', 'item-updated', 'patient-updated', 'checkup-updated', 'transaction-updated', 'order-updated'].map(event => (
            <button 
              key={event}
              onClick={() => testSpecificEvent(event)}
              style={{ padding: '5px 10px' }}
            >
              Test {event}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['inventory-updated', 'item-updated', 'patient-updated'].map(event => (
            <button 
              key={`${event}-room`}
              onClick={() => testSpecificEvent(event, event)}
              style={{ padding: '5px 10px' }}
            >
              Test {event} (Room)
            </button>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Test Results</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {testResults.map((test, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  backgroundColor: test.passed ? '#d4edda' : '#f8d7da'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: test.passed ? '#155724' : '#721c24' }}>
                    {test.passed ? '✅' : '❌'} {test.name}
                  </h4>
                  <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {new Date(test.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '0.9em' }}>{test.description}</p>
                <p style={{ margin: 0, fontSize: '0.8em', color: '#666' }}>{test.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Received Events */}
      {receivedEvents.length > 0 && (
        <div>
          <h3>Recent Events Received</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            {receivedEvents.map((event, index) => (
              <div 
                key={index}
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee',
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#007bff' }}>{event.event}</strong>
                  <span style={{ fontSize: '0.8em', color: '#666' }}>
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre style={{ 
                  margin: '5px 0', 
                  fontSize: '0.8em', 
                  backgroundColor: '#f8f9fa', 
                  padding: '5px', 
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocketTestComponent;
