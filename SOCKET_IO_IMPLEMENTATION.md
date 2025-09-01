# Socket.IO Real-Time Updates Implementation

This document describes the Socket.IO real-time updates implementation for the Tiberio application.

## Overview

Socket.IO has been implemented to provide real-time updates for the following features:
- **Inventory Management** - Real-time updates when items are added, updated, or deleted
- **Price List** - Real-time updates for items under subcategories
- **Patients** - Real-time updates when patients are added, updated, or deleted
- **Checkups** - Real-time updates when checkups are added, updated, or deleted

## Backend Implementation

### Dependencies
- `socket.io` - Added to `Tiberio/Backend/package.json`

### Server Setup
- Modified `Tiberio/Backend/app.js` to include Socket.IO server
- Configured CORS for frontend connection
- Added room-based event system for targeted updates

### Event Emitters
The following events are emitted from the backend controllers:

#### Inventory & Items (`categoryController.js`)
- `item-updated` - Emitted when items are added, updated, or deleted
- `inventory-updated` - Emitted when inventory items are modified

#### Patients (`patientController.js`)
- `patient-updated` - Emitted when patients are added, updated, or deleted

#### Checkups (`checkupController.js`)
- `checkup-updated` - Emitted when checkups are added, updated, or deleted

## Frontend Implementation

### Dependencies
- `socket.io-client` - Added to `Tiberio/Frontend/Tiberio/package.json`

### Socket Service
- Created `Tiberio/Frontend/Tiberio/src/services/socket.js`
- Singleton pattern for connection management
- Automatic reconnection handling
- Room-based event listening

### Component Integration

#### Inventory Component
- Listens to `inventory-updated` events
- Automatically refreshes data on item changes
- Visual indicator showing "Live Updates" status

#### Price List Component
- Listens to `item-updated` events
- Refreshes items for currently selected subcategory
- Visual indicator showing "Live Updates" status

#### Patients Component
- Listens to `patient-updated` events for patient changes
- Listens to `checkup-updated` events for checkup changes
- Updates patient list and checkup counts in real-time
- Visual indicator showing "Live Updates" status

## Event Structure

### Item Events
```javascript
{
  type: 'added' | 'updated' | 'deleted',
  item: { /* item data */ } | itemId: number
}
```

### Patient Events
```javascript
{
  type: 'added' | 'updated' | 'deleted',
  patient: { /* patient data */ } | patientId: number
}
```

### Checkup Events
```javascript
{
  type: 'added' | 'updated' | 'deleted',
  checkup: { /* checkup data */ } | checkupId: number
}
```

## Usage

### Starting the Application
1. Start the backend server: `cd Tiberio/Backend && npm start`
2. Start the frontend: `cd Tiberio/Frontend/Tiberio && npm run dev`

### Real-Time Features
- **Inventory**: When items are added/updated/deleted, all connected clients see changes immediately
- **Price List**: When items are modified in a subcategory, the list updates in real-time
- **Patients**: New patients appear immediately on all connected clients
- **Checkups**: New checkups appear immediately for the relevant patient

### Visual Indicators
- Green pulsing dot and "Live Updates" text in the header of each component
- Console logs show real-time event reception for debugging

## Technical Details

### Connection Management
- Automatic reconnection with exponential backoff
- Connection status monitoring
- Graceful cleanup on component unmount

### Room-Based Updates
- Clients join specific rooms for targeted updates
- Reduces unnecessary data transmission
- Improves performance for large datasets

### Error Handling
- Graceful fallback if Socket.IO connection fails
- Console logging for debugging
- No impact on core functionality if real-time features are unavailable

## Future Enhancements
- Add user presence indicators
- Implement typing indicators for collaborative features
- Add notification system for important updates
- Optimize for mobile connections
