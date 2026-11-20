@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0infra\ABRIR_FRONTEND.ps1"
if errorlevel 1 pause
