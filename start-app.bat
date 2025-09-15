@echo off
echo Starting Tiberio Application...
echo.
echo This will start both the backend server and frontend development server.
echo.
cd /d "paste/your/project/path/here"
echo Current directory: %CD%
echo.
echo Running npm run dev...
npm run dev
pause