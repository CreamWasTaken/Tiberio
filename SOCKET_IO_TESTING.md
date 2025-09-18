# Socket.IO Testing Documentation

This document provides comprehensive information about testing the Socket.IO implementation in the Tiberio application.

## Overview

The Socket.IO testing suite includes both backend and frontend components to ensure real-time functionality works correctly across all features.

## Backend Test Endpoints

### 1. Comprehensive Test Suite
**Endpoint:** `GET /api/test-socket`

Runs a complete test suite covering all Socket.IO functionality:

- **Connection Test**: Verifies Socket.IO server is running
- **Room Management Test**: Checks room system functionality
- **Event Emission Tests**: Tests all event types:
  - `inventory-updated`
  - `item-updated`
  - `patient-updated`
  - `checkup-updated`
  - `transaction-updated`
  - `order-updated`
- **Patient Room Test**: Tests patient-specific room events
- **Performance Test**: Tests emission performance (100 events)

**Response Format:**
```json
{
  "message": "Socket.IO test suite completed",
  "successRate": "100.00%",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "tests": [
    {
      "name": "Connection Test",
      "description": "Check if Socket.IO server is running and can count clients",
      "passed": true,
      "details": "Connected clients: 2",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "summary": {
    "total": 10,
    "passed": 10,
    "failed": 0
  }
}
```

### 2. Specific Event Testing
**Endpoint:** `POST /api/test-socket/event`

Allows testing of specific events with custom data.

**Request Body:**
```json
{
  "event": "inventory-updated",
  "room": "inventory-updated",
  "data": {
    "message": "Custom test data",
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "message": "Event inventory-updated emitted successfully",
  "event": "inventory-updated",
  "room": "inventory-updated",
  "data": {
    "type": "manual_test",
    "message": "Manual test event",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "message": "Custom test data",
    "customField": "value"
  }
}
```

### 3. Socket Status
**Endpoint:** `GET /api/socket-status`

Returns current Socket.IO server status and statistics.

**Response:**
```json
{
  "status": "running",
  "connectedClients": 3,
  "totalRooms": 5,
  "rooms": [
    {
      "name": "inventory-updated",
      "clientCount": 2
    },
    {
      "name": "patient-123-checkups",
      "clientCount": 1
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Frontend Test Component

### SocketTestComponent.jsx

A React component that provides a comprehensive testing interface for Socket.IO functionality.

**Features:**
- Real-time connection status monitoring
- Server status display
- Backend test execution
- Frontend test execution
- Manual event testing
- Room management (join/leave)
- Event reception monitoring
- Test result visualization

**Usage:**
```jsx
import SocketTestComponent from './components/SocketTestComponent';

function App() {
  return (
    <div>
      <SocketTestComponent />
    </div>
  );
}
```

## Event Types Tested

### 1. Inventory Events
- **Event:** `inventory-updated`
- **Room:** `inventory-updated`
- **Triggers:** Item stock changes, inventory modifications
- **Data Structure:**
```json
{
  "type": "added|updated|deleted|stock_updated",
  "item": {
    "id": "item_id",
    "name": "Item Name",
    "stock": 10,
    "price": 99.99
  }
}
```

### 2. Item Events
- **Event:** `item-updated`
- **Room:** `item-updated`
- **Triggers:** Item creation, updates, deletion
- **Data Structure:**
```json
{
  "type": "added|updated|deleted",
  "item": {
    "id": "item_id",
    "name": "Item Name",
    "description": "Item Description",
    "price": 99.99,
    "supplier_id": "supplier_id"
  }
}
```

### 3. Patient Events
- **Event:** `patient-updated`
- **Room:** `patient-updated`
- **Triggers:** Patient creation, updates, deletion
- **Data Structure:**
```json
{
  "type": "added|updated|deleted",
  "patient": {
    "id": "patient_id",
    "name": "Patient Name",
    "email": "patient@example.com",
    "phone": "123-456-7890"
  }
}
```

### 4. Checkup Events
- **Event:** `checkup-updated`
- **Room:** `patient-{patient_id}-checkups`
- **Triggers:** Checkup creation, updates, deletion
- **Data Structure:**
```json
{
  "type": "added|updated|deleted",
  "checkup": {
    "id": "checkup_id",
    "patient_id": "patient_id",
    "date": "2024-01-01T12:00:00.000Z",
    "notes": "Checkup notes"
  }
}
```

### 5. Transaction Events
- **Event:** `transaction-updated`
- **Room:** `patient-{patient_id}-transactions`
- **Triggers:** Transaction creation, updates, deletion, fulfillment, refunds
- **Data Structure:**
```json
{
  "type": "added|updated|deleted|item_fulfilled|item_refunded",
  "transaction": {
    "id": "transaction_id",
    "patient_id": "patient_id",
    "total_amount": 199.98,
    "status": "completed",
    "items": [
      {
        "item_id": "item_id",
        "quantity": 2,
        "price": 99.99
      }
    ]
  }
}
```

### 6. Order Events
- **Event:** `order-updated`
- **Room:** `order-updated`
- **Triggers:** Order creation, updates, deletion, status changes
- **Data Structure:**
```json
{
  "type": "added|updated|deleted",
  "order": {
    "id": "order_id",
    "supplier_id": "supplier_id",
    "status": "pending",
    "total_amount": 500.00,
    "items": [
      {
        "item_id": "item_id",
        "quantity": 5,
        "price": 100.00
      }
    ]
  }
}
```

## Testing Scenarios

### 1. Basic Connectivity
- Verify Socket.IO server is running
- Check client connection status
- Test reconnection functionality

### 2. Event Emission
- Test all event types with sample data
- Verify room-based vs global emission
- Check event data structure

### 3. Room Management
- Test joining/leaving rooms
- Verify room-specific event delivery
- Check patient-specific rooms

### 4. Performance Testing
- Test high-frequency event emission
- Measure emission latency
- Verify system stability under load

### 5. Error Handling
- Test connection failures
- Verify reconnection attempts
- Check error event handling

## Running Tests

### Backend Tests
```bash
# Start the backend server
cd Backend
npm start

# Run comprehensive test suite
curl http://localhost:5000/api/test-socket

# Test specific event
curl -X POST http://localhost:5000/api/test-socket/event \
  -H "Content-Type: application/json" \
  -d '{"event": "inventory-updated", "room": "inventory-updated"}'

# Get socket status
curl http://localhost:5000/api/socket-status
```

### Frontend Tests
1. Import and render `SocketTestComponent` in your React app
2. Use the UI to run various tests
3. Monitor real-time event reception
4. Check test results and connection status

## Troubleshooting

### Common Issues

1. **Socket.IO not available**
   - Check if Socket.IO server is running
   - Verify `app.set('io', io)` is called in app.js

2. **Events not received**
   - Check if client is connected
   - Verify room membership
   - Check event listener registration

3. **Performance issues**
   - Monitor emission frequency
   - Check for memory leaks
   - Verify connection limits

### Debug Information

Enable debug logging by setting:
```javascript
localStorage.debug = 'socket.io-client:*';
```

Check browser console for Socket.IO debug messages and connection status.

## Best Practices

1. **Always test both backend and frontend**
2. **Use the comprehensive test suite for initial verification**
3. **Test specific scenarios with manual event testing**
4. **Monitor performance under realistic load**
5. **Verify error handling and reconnection**
6. **Test room management thoroughly**
7. **Check event data structure consistency**

## Integration with CI/CD

The test endpoints can be integrated into automated testing pipelines:

```bash
# Example CI script
#!/bin/bash
echo "Testing Socket.IO implementation..."

# Test backend
curl -f http://localhost:5000/api/test-socket || exit 1

# Test specific events
curl -f -X POST http://localhost:5000/api/test-socket/event \
  -H "Content-Type: application/json" \
  -d '{"event": "inventory-updated"}' || exit 1

echo "Socket.IO tests passed!"
```

This comprehensive testing suite ensures that the Socket.IO implementation is robust, performant, and reliable across all features of the Tiberio application.
