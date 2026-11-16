param([switch]$Estricto)
$ErrorActionPreference='Stop'
$checks=@(
  @{nombre='Angular';puerto=4200;url='http://localhost:4200/inicio'},
  @{nombre='Keycloak';puerto=8180;url='http://localhost:8180/realms/myacademy/.well-known/openid-configuration'},
  @{nombre='Elasticsearch';puerto=9200;url='http://localhost:9200'},
  @{nombre='Catálogo';puerto=8080;url='http://localhost:8080/actuator/health'},
  @{nombre='Pagos';puerto=8081;url='http://localhost:8081/api/pagos'},
  @{nombre='Matrículas';puerto=8082;url='http://localhost:8082/api/matriculas'}
)
$faltan=@()
foreach($check in $checks){
  $cliente=New-Object System.Net.Sockets.TcpClient
  $activo=$false
  try{
    $task=$cliente.ConnectAsync('127.0.0.1',[int]$check.puerto)
    $activo=$task.Wait(2500) -and $cliente.Connected
  }catch{}finally{$cliente.Close()}
  if(-not $activo){
    Write-Host ("NO DISPONIBLE: "+$check.nombre+" (puerto "+$check.puerto+")") -ForegroundColor Yellow
    $faltan+=$check.nombre
    continue
  }
  try{
    $r=Invoke-WebRequest -UseBasicParsing -Uri $check.url -TimeoutSec 5
    Write-Host ("OK "+$check.nombre+": HTTP "+[int]$r.StatusCode) -ForegroundColor Green
  }catch{
    $status=0
    if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}
    if($status -eq 401 -or $status -eq 403){
      Write-Host ("OK "+$check.nombre+": HTTP "+$status+" (protegido por autenticación)") -ForegroundColor Green
    }else{
      Write-Host ("REVISAR "+$check.nombre+": HTTP "+$status+" - "+$_.Exception.Message) -ForegroundColor Yellow
      $faltan+=$check.nombre
    }
  }
}
if($faltan.Count -gt 0){
  Write-Host ("Pendientes: "+($faltan -join ', ')) -ForegroundColor Yellow
  Write-Host 'Los puertos disponibles no garantizan operaciones completas; revisa también los logs Java.'
  if($Estricto){throw 'No todos los servicios responden correctamente.'}
}else{
  Write-Host 'Servicios accesibles. Comprueba acciones de lectura/escritura en el navegador.' -ForegroundColor Green
}
