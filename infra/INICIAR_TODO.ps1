param([switch]$Ligero)
$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
$infra=Join-Path $PSScriptRoot 'INICIAR_INFRA.ps1'
Write-Host 'MyAcademy - inicio del entorno local' -ForegroundColor Cyan

if($Ligero){
  Write-Host 'Modo ligero: no se inicia Kafka ni Jaeger. Algunos microservicios pueden depender de Kafka.' -ForegroundColor Yellow
  & $infra -PrepararRepos
}else{
  & $infra -PrepararRepos -ConKafka -ConObservabilidad
}
if(-not $?) { throw 'No se pudo completar la inicialización Docker.' }

Write-Host 'Abriendo consolas de los microservicios Java...' -ForegroundColor Cyan
if($Ligero){
  & (Join-Path $PSScriptRoot 'ABRIR_APIS.ps1')
}else{
  & (Join-Path $PSScriptRoot 'ABRIR_APIS.ps1') -IncluirIndexer
}

if (Get-Command fnm -ErrorAction SilentlyContinue) {
  fnm env --shell powershell | Out-String | Invoke-Expression
  fnm use 22.23.5
  if ($LASTEXITCODE -ne 0) { throw 'FNM no pudo activar Node.js 22.23.5. Ejecuta fnm install 22.23.5.' }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node no está instalado. Requiere Node.js 22.22.3 o superior compatible.' }
Write-Host "Node activo: $(node -v)"
Set-Location $front
if (-not (Test-Path (Join-Path $front 'node_modules'))) {
  npm ci
  if($LASTEXITCODE -ne 0){throw 'npm ci falló. Revisa el mensaje.'}
}
Write-Host 'Abriendo Angular en http://localhost:4200/inicio' -ForegroundColor Green
Write-Host 'Mantén esta terminal abierta. Abre /gestion/integraciones para verificar las APIs.'
npm start
