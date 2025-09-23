:: This script stops both the backend (Node.js) and frontend (Vite) servers
:: Created by: GitHub Copilot
:: Last updated: 2025-09-19

@echo off
echo Stopping Tiberio Application...

:: Kill the Node.js backend server running on port !Make sure this is the correct port!
echo Stopping Node.js server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a
)

:: Kill the Vite development server running on port 5173 !Make sure this is the correct port 5173 is the vite Port!
echo Stopping Vite server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /F /PID %%a
)

:: Display completion message and wait briefly
echo All processes have been terminated.
timeout /t 2 >nul