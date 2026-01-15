@echo off
echo Setting up Node.js environment...
SET "PATH=C:\Program Files\nodejs;%PATH%"

echo Checking/Installing dependencies...
cmd /c "npm install"

echo Starting CRM Application...
cmd /c "npm run dev"
pause
