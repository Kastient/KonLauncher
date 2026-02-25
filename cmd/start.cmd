@echo off
setlocal

rem Always run from project root, no matter where script was called from.
cd /d "%~dp0.."

echo Building KonLauncher UI...
call npm run build
if errorlevel 1 goto :end

echo Starting KonLauncher...
call npm run start:app

:end
endlocal
