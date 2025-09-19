
@echo off

if not defined HIDDEN_WINDOW (
    start "" /B wscript.exe "%~dp0start-hidden.vbs"
    exit
)

:: Please replace the path with your path of the backend 
cd /d "C:\Users\Jamin\Desktop\Tiberio\Backend"
call npm run dev
