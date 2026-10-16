@echo off
title GovScheme Preview (4173) - offline demo build
cd /d "%~dp0frontend"
:loop
echo [%time%] Starting production preview on port 4173... (details: dev_preview.log)
echo ================ [%date% %time%] starting preview ================ >> "%~dp0dev_preview.log"
call npm run preview >> "%~dp0dev_preview.log" 2>&1
echo [%time%] Preview stopped - auto-restarting in 3 seconds... (close this window to stop)
echo ================ [%date% %time%] preview exited, restarting ================ >> "%~dp0dev_preview.log"
ping -n 4 127.0.0.1 >nul
goto loop
