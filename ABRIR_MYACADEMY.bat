@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0infra\INICIAR_TODO.ps1" -Modo Api
if errorlevel 1 (
  echo.
  echo No se pudo iniciar toda la infraestructura.
  echo Revisa Docker Desktop, JDK y los microservicios con infra\DIAGNOSTICO_GENERAL.ps1
  echo La interfaz puede abrirse sin datos ficticios, aunque las APIs no respondan.
  choice /C SN /M "Abrir solamente el frontend (S/N)"
  if errorlevel 2 exit /b 1
  call "%~dp0VER_FRONTEND.bat"
)
