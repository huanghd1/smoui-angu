@echo off
setlocal
cd /d "%~dp0"

rem -- start the local server only if the port is not already listening
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 8177 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Start-Process -FilePath node -ArgumentList 'tools/serve.mjs' -WorkingDirectory '%~dp0' -WindowStyle Hidden }"

timeout /t 2 >nul
start "" msedge "http://127.0.0.1:8177/index.html" || start "" "http://127.0.0.1:8177/index.html"
endlocal
