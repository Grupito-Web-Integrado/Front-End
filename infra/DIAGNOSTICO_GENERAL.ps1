# Diagnóstico de solo lectura. No instala, borra ni cambia configuraciones globales.
$ErrorActionPreference='Continue'
$front=Split-Path $PSScriptRoot -Parent
Write-Host ''
Write-Host '=== MYACADEMY · DIAGNÓSTICO DE ENTORNO ===' -ForegroundColor Cyan
Write-Host ('Proyecto: '+$front)
Write-Host ''
function Estado([string]$nombre,[bool]$correcto,[string]$detalle) {
  $label=if($correcto){'OK'}else{'REVISAR'}
  $color=if($correcto){'Green'}else{'Yellow'}
  Write-Host ("[$label] $nombre : $detalle") -ForegroundColor $color
}
function Puerto([int]$num){
  $client=New-Object System.Net.Sockets.TcpClient
  try{
    $task=$client.ConnectAsync('127.0.0.1',$num)
    return ($task.Wait(900) -and $client.Connected)
  }catch{return $false}finally{$client.Close()}
}
$git=Get-Command git -ErrorAction SilentlyContinue
if($git){
  $branch=(& git -C $front branch --show-current 2>$null)
  Estado 'Git' $true ('Rama: '+($branch -join ''))
}else{Estado 'Git' $false 'Instala Git para actualizar la rama'}
$node=Get-Command node -ErrorAction SilentlyContinue
if($node){
  $version=(& node -v 2>$null | Out-String).Trim()
  Estado 'Node.js' ($version -match '^v(22|24|26)\.') $version
}else{Estado 'Node.js' $false 'Node no figura en esta consola; activa fnm 22.23.5'}
$javac=Get-Command javac -ErrorAction SilentlyContinue
if($javac){
  $compiler=(& javac -version 2>&1 | Out-String).Trim()
  Estado 'JDK / javac' ($compiler -match 'javac (21|22|23|24|25|26)') $compiler
}else{Estado 'JDK / javac' $false 'Comprueba Eclipse Temurin JDK 21 o ejecuta SELECCIONAR_JAVA.ps1'}
$docker=Get-Command docker -ErrorAction SilentlyContinue
if($docker){
  $engine=(& docker info --format '{{.OSType}}' 2>$null | Out-String).Trim()
  Estado 'Docker Linux Engine' ($LASTEXITCODE -eq 0 -and $engine -eq 'linux') ($(if($engine){$engine}else{'Docker Desktop no está ejecutando contenedores Linux'}))
}else{Estado 'Docker Linux Engine' $false 'Falta la CLI de Docker Desktop'}
$pathDocker=@(
  (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
  (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe')
)
$instalado=@($pathDocker|Where-Object {Test-Path $_})
Estado 'Docker Desktop instalado' ($instalado.Count -gt 0) ($(if($instalado.Count){$instalado[0]}else{'No se encuentra el ejecutable de Docker Desktop'}))
foreach($entry in @(
  @{nombre='Angular';puerto=4200},
  @{nombre='Catálogo';puerto=8080},
  @{nombre='Pagos';puerto=8081},
  @{nombre='Matrículas';puerto=8082},
  @{nombre='Indexer de Joker';puerto=8084},
  @{nombre='Keycloak';puerto=8180},
  @{nombre='Elasticsearch';puerto=9200}
)){
  $ok=Puerto $entry.puerto
  Estado $entry.nombre $ok ('Puerto '+$entry.puerto+$(if($ok){' accesible'}else{' sin servicio'}))
}
try{
  $url='http://127.0.0.1:8180/realms/myacademy/.well-known/openid-configuration'
  $oidc=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
  Estado 'Keycloak OIDC' ($oidc.StatusCode -eq 200) ('HTTP '+$oidc.StatusCode)
}catch{Estado 'Keycloak OIDC' $false 'Realm myacademy no responde todavía'}
Write-Host ''
Write-Host 'Para abrir SOLO la interfaz, sin mocks: .\VER_FRONTEND.bat' -ForegroundColor Cyan
Write-Host 'Para iniciar TODOS los servicios: .\ABRIR_MYACADEMY.bat' -ForegroundColor Cyan
Write-Host 'Las contraseñas no se consultan ni se muestran en este diagnóstico.'
