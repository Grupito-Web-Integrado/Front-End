$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
Set-Location $front
if(Get-Command fnm -ErrorAction SilentlyContinue){
  fnm env --shell powershell | Out-String | Invoke-Expression
  fnm use 22.23.5
  if($LASTEXITCODE -ne 0){throw 'No se encontró Node 22.23.5: fnm install 22.23.5'}
}
if(-not(Get-Command node -ErrorAction SilentlyContinue)){throw 'Se necesita Node 22.23.5.'}
Write-Host "Node: $(node -v)"
if(-not(Test-Path (Join-Path $front 'node_modules'))){
  npm ci
  if($LASTEXITCODE -ne 0){throw 'npm ci falló.'}
}
npm start
if($LASTEXITCODE -ne 0){throw 'Falló Angular. Revisa los errores de esta ventana.'}
