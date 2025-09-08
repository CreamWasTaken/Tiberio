@echo off
echo Finding your IP address...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set ip=%%b
        goto :found
    )
)

:found
echo Your IP address is: %ip%
echo.
echo Update your frontend .env file with:
echo VITE_API_URL=http://%ip%:3000/api
echo VITE_SOCKET_URL=http://%ip%:3000
echo.
echo Access your application from other devices at:
echo Frontend: http://%ip%:5173
echo Backend API: http://%ip%:3000/api
echo.
pause
