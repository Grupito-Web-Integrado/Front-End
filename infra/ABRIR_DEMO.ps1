$ErrorActionPreference='Stop'
$script=Join-Path $PSScriptRoot 'EJECUTAR_ANGULAR.ps1'
$url='http://127.0.0.1:4200/inicio'
$ready=$false
try{$ready=(Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2).StatusCode -eq 200}catch{}
if(-not $ready){
  Write-Host 'Arrancando Angular demo (sin Docker ni Java)...' -ForegroundColor Cyan
  $params=@('-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + $script + '"'))
  $child=Start-Process 'powershell.exe' -ArgumentList $params -PassThru
  for($n=0;$n -lt 60;$n++){
    Start-Sleep -Milliseconds 700
    try{$ready=(Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2).StatusCode -eq 200}catch{}
    if($ready -or $child.HasExited){break}
  }
}
if($ready){
  Write-Host 'Sitio disponible: http://localhost:4200/inicio' -ForegroundColor Green
  Start-Process 'http://localhost:4200/inicio'
}else{
  throw 'Angular todavía no responde. Revisa la ventana PowerShell del servidor.'
}
