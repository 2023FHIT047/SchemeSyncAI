@echo off
REM Launches backend + frontend in their own windows. They auto-restart on crash.
REM Close those windows to stop the servers. Double-click dev_preview.bat for the offline demo build.
start "GovScheme Backend" cmd /c "%~dp0dev_backend.bat"
start "GovScheme Frontend" cmd /c "%~dp0dev_frontend.bat"
echo.
echo GovScheme servers are starting in separate windows:
echo   - GovScheme Backend  (Django,  http://127.0.0.1:8001)
echo   - GovScheme Frontend (Vite,    http://localhost:5173)
echo Keep those windows open while working. Close them to stop the servers.
echo.
timeout /t 5 /nobreak >nul
