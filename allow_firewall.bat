@echo off
echo Adding Windows Firewall rules for DineQR...
echo.

netsh advfirewall firewall add rule name="DineQR Frontend (Port 5173)" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="DineQR Backend (Port 5000)" dir=in action=allow protocol=TCP localport=5000

echo.
echo Firewall rules added successfully!
echo You can now access the app from your mobile device.
echo.
pause
