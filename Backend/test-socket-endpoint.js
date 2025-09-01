// Test endpoint to verify Socket.IO events
const testSocketEvent = (req, res) => {
  const io = req.app.get('io');
  if (io) {
    console.log('🔌 Emitting test event...');
    
    // Emit to room
    io.to('inventory-updated').emit('inventory-updated', { 
      type: 'test', 
      message: 'Test event from backend (room)',
      timestamp: new Date().toISOString()
    });
    
    // Also emit to all connected clients
    io.emit('inventory-updated', { 
      type: 'test', 
      message: 'Test event from backend (all clients)',
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Test event emitted successfully' });
  } else {
    res.status(500).json({ error: 'Socket.IO not available' });
  }
};

module.exports = { testSocketEvent };
