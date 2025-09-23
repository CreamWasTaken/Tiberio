`@echo off
echo Starting Tiberio Application...
echo.
echo This will start both the backend server and frontend development server.
echo.
cd /d "C:\Users\Administrator\Desktop\New System\Tiberio\Backend"
echo Current directory: %CD%
echo.
echo Running npm run dev...
npm run dev
pause

@echo off

if not defined HIDDEN_WINDOW (
    start "" /B wscript.exe "%~dp0start-hidden.vbs"
    exit
)

:: Please replace the path with your path of the backend 
cd /d "C:\Users\Administrator\Desktop\New System\Tiberio\Backend"
call npm run dev
