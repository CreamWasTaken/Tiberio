# Network Setup Guide for Tiberio

## Overview
This guide will help you configure Tiberio to run on your local network, allowing other devices to access the application.

## Prerequisites
- Both backend and frontend .env files are already configured
- Your computer and other devices are on the same network

## Step 1: Find Your IP Address

### Windows:
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter (usually starts with 192.168.x.x or 10.x.x.x)

### Mac/Linux:
```bash
ifconfig
```
Look for "inet" address under your network interface

## Step 2: Update Backend Configuration

The backend has been configured to:
- Accept connections from any origin (CORS: "*")
- Bind to all network interfaces (0.0.0.0)
- Run on port 3000 (or your configured PORT)

## Step 3: Update Frontend Configuration

Update your frontend .env file with your IP address:

```env
# Replace YOUR_IP_ADDRESS with your actual IP address
VITE_API_URL=http://YOUR_IP_ADDRESS:3000/api
VITE_SOCKET_URL=http://YOUR_IP_ADDRESS:3000
```

Example:
```env
VITE_API_URL=http://192.168.1.100:3000/api
VITE_SOCKET_URL=http://192.168.1.100:3000
```

## Step 4: Start the Applications

### Backend:
```bash
cd Backend
npm start
```

### Frontend:
```bash
cd Frontend/Tiberio
npm run dev
```

## Step 5: Access from Other Devices

Once both applications are running:
- **Frontend**: Access via `http://YOUR_IP_ADDRESS:5173`
- **Backend API**: Available at `http://YOUR_IP_ADDRESS:3000/api`

## Security Notes

⚠️ **Important Security Considerations:**

1. **CORS is set to allow all origins** - This is for development only
2. **Database credentials** - Ensure your database is properly secured
3. **JWT secrets** - Use strong, unique secrets in production
4. **Firewall** - You may need to allow ports 3000 and 5173 through your firewall

## Troubleshooting

### Connection Issues:
1. **Check firewall settings** - Allow ports 3000 and 5173
2. **Verify IP address** - Make sure you're using the correct IP
3. **Network connectivity** - Ensure devices are on the same network
4. **Port conflicts** - Check if ports are already in use

### Common Commands:
```bash
# Check if ports are in use
netstat -an | findstr :3000
netstat -an | findstr :5173

# Test connectivity
ping YOUR_IP_ADDRESS
```

## Production Considerations

For production deployment:
1. Set specific CORS origins instead of "*"
2. Use HTTPS with proper SSL certificates
3. Implement proper authentication and authorization
4. Use environment-specific configuration
5. Set up proper logging and monitoring
