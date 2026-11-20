param([switch]$IncluirIndexer)
$servicios = @('catalogo','matricula','pagos')
if ($IncluirIndexer){ $servicios += 'indexer' }
$script = Join-Path $PSScriptRoot 'INICIAR_SERVICIO.ps1'
foreach($svc in $servicios){
  Write-Host "Abriendo consola de $svc"
  $args = '-NoExit -ExecutionPolicy Bypass -File "' + $script + '" -Servicio ' + $svc
  Start-Process powershell.exe -ArgumentList $args
}
Write-Host 'Revisa las terminales abiertas. Un comando iniciado no garantiza que el servicio haya arrancado.'
