@echo off
title GovScheme Frontend (5173) - keep this window open
cd /d "%~dp0frontend"
:loop
echo [%time%] Starting Vite dev server on port 5173... (details: dev_frontend.log)
echo ================ [%date% %time%] starting vite ================ >> "%~dp0dev_frontend.log"
call npm run dev >> "%~dp0dev_frontend.log" 2>&1
echo [%time%] Frontend stopped - auto-restarting in 3 seconds... (close this window to stop)
echo ================ [%date% %time%] vite exited, restarting ================ >> "%~dp0dev_frontend.log"
ping -n 4 127.0.0.1 >nul
goto loop
