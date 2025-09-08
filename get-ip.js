const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const ipAddress = getLocalIPAddress();
console.log('🌐 Your local IP address is:', ipAddress);
console.log('');
console.log('📝 Update your frontend .env file with:');
console.log(`VITE_API_URL=http://${ipAddress}:3000/api`);
console.log(`VITE_SOCKET_URL=http://${ipAddress}:3000`);
console.log('');
console.log('🔗 Access your application from other devices at:');
console.log(`Frontend: http://${ipAddress}:5173`);
console.log(`Backend API: http://${ipAddress}:3000/api`);
