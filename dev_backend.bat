@echo off
title GovScheme Backend (8001) - keep this window open
cd /d "%~dp0backend"
:loop
echo [%time%] Starting Django backend on port 8001... (details: dev_backend.log)
echo ================ [%date% %time%] starting runserver ================ >> "%~dp0dev_backend.log"
python manage.py runserver 127.0.0.1:8001 >> "%~dp0dev_backend.log" 2>&1
echo [%time%] Backend stopped - auto-restarting in 3 seconds... (close this window to stop)
echo ================ [%date% %time%] runserver exited, restarting ================ >> "%~dp0dev_backend.log"
ping -n 4 127.0.0.1 >nul
goto loop
