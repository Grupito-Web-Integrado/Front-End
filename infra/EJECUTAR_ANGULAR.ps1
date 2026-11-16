$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
Set-Location $front
if(Get-Command fnm -ErrorAction SilentlyContinue){
  fnm env --shell powershell | Out-String | Invoke-Expression
  fnm use 22.23.5
  if($LASTEXITCODE -ne 0){throw 'Node 22.23.5 no está en fnm. Ejecuta fnm install 22.23.5.'}
}
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Instala Node 22.23.5 o actívalo con fnm.'}
$nodeVersion=(node -v).Trim()
Write-Host "Node activo solo en esta terminal: $nodeVersion" -ForegroundColor Cyan
if($nodeVersion -notmatch '^v(22|24|26)\.'){throw 'La CLI Angular necesita Node compatible (22.22.3+, 24.15+, 26+).'}
if(-not(Get-Command npm -ErrorAction SilentlyContinue)){throw 'No se encuentra npm.'}
$lock=Join-Path $front 'package-lock.json'
if(-not(Test-Path $lock)){throw 'Falta package-lock.json. Revisa la carpeta del repositorio.'}
$nodeModules=Join-Path $front 'node_modules'
$marker=Join-Path $nodeModules '.myacademy-package-lock.sha256'
$hash=(Get-FileHash -Algorithm SHA256 -Path $lock).Hash
$needInstall= -not (Test-Path $nodeModules) -or -not (Test-Path $marker)
if(-not $needInstall){$needInstall=(([IO.File]::ReadAllText($marker)).Trim() -ne $hash)}
if($needInstall){
  Write-Host 'Instalando dependencias exactas de package-lock.json...' -ForegroundColor Yellow
  npm ci
  if($LASTEXITCODE -ne 0){throw 'npm ci falló. Revisa el error de npm.'}
  [IO.File]::WriteAllText($marker,$hash,(New-Object System.Text.UTF8Encoding($false)))
}
Write-Host 'Servidor Angular en http://localhost:4200' -ForegroundColor Green
npm start
if($LASTEXITCODE -ne 0){throw 'Angular devolvió un error. Revisa esta terminal.'}
