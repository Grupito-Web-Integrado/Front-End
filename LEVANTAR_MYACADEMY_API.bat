@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0infra\INICIAR_TODO.ps1" -Modo Api
if errorlevel 1 pause
