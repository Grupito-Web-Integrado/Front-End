$ErrorActionPreference='Stop'
$childScript=Join-Path $PSScriptRoot 'EJECUTAR_ANGULAR.ps1'
$probe='http://127.0.0.1:4200/inicio'
$url='http://localhost:4200/inicio?modo=demo'
$ready=$false
try{$ready=(Invoke-WebRequest -UseBasicParsing -Uri $probe -TimeoutSec 2).StatusCode -eq 200}catch{}
if(-not $ready){
  Write-Host 'Abriendo Angular en una ventana independiente...' -ForegroundColor Cyan
  $args=@('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $childScript + '"'))
  $child=Start-Process powershell.exe -ArgumentList $args -PassThru
  for($n=0;$n -lt 120;$n++){
    Start-Sleep -Milliseconds 700
    try{$ready=(Invoke-WebRequest -UseBasicParsing -Uri $probe -TimeoutSec 2).StatusCode -eq 200}catch{}
    if($ready -or $child.HasExited){break}
  }
}
if(-not $ready){throw 'No responde localhost:4200. Revisa el error en la consola PowerShell de Angular.'}
Write-Host 'Angular responde. Abriendo modo demostración...' -ForegroundColor Green
Start-Process $url
