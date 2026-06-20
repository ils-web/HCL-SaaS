@echo off
echo Starting Backend, Super Admin, and Tenant App in separate windows...

start "Backend" cmd /k "npm run dev"
start "Super Admin" cmd /k "cd super-admin && npm run dev"
start "Tenant App" cmd /k "cd tenant-app && npm run dev"

echo All services are starting up!
