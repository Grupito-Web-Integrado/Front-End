param(
  [ValidateSet('Api')][string]$Modo='Api',
  [switch]$ConObservabilidad
)
$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
$root=Split-Path $front -Parent
foreach($cmd in @('git','docker','java')){
  if(-not(Get-Command $cmd -ErrorAction SilentlyContinue)){throw "Para API se necesita $cmd."}
}
$javaInfo=(& java --version | Out-String)
if($javaInfo -notmatch '(?im)^(?:openjdk|java)\s+(?:version\s+)?"?21(?:\.|\s|"|$)'){
  throw "API requiere Java JDK 21. Detectado: $javaInfo"
}
$required=@(
  @{repo='Catalogo-Cursos-Publico-1A';file='src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\outbox\publisher\OutboxKafkaConfig.java'},
  @{repo='Catalogo-Cursos-Publico-1A';file='src\main\resources\application-keycloak.yaml'},
  @{repo='Matricula-Publico_1E';file='src\main\java\com\example\Matricula_Pedidos\integration\web\EnrollmentRestController.java'},
  @{repo='Estados_de_Pago';file='src\main\resources\application-keycloak.properties'}
)
foreach($item in $required){
  $p=Join-Path (Join-Path $root $item.repo) $item.file
  if(-not(Test-Path $p)){
    throw "No se encontró $p. Primero revisa y ejecuta .\infra\PREPARAR_BACKENDS.ps1 -Confirmar en un clon limpio."
  }
}
Write-Host 'Levantando contenedores y Kafka...' -ForegroundColor Cyan
if($ConObservabilidad){
  & (Join-Path $PSScriptRoot 'INICIAR_INFRA.ps1') -PrepararRepos -ConKafka -ConObservabilidad
}else{
  & (Join-Path $PSScriptRoot 'INICIAR_INFRA.ps1') -PrepararRepos -ConKafka
}
if(-not $?){throw 'No se levantó infraestructura; revisa Docker.'}
$oidc='http://localhost:8180/realms/myacademy/.well-known/openid-configuration'
Write-Host 'Comprobando Keycloak...'
$ready=$false
for($n=0;$n -lt 70;$n++){
  try{
    $response=Invoke-WebRequest -UseBasicParsing -Uri $oidc -TimeoutSec 3
    if($response.StatusCode -eq 200){$ready=$true;break}
  }catch{}
  Start-Sleep -Seconds 2
}
if(-not $ready){throw 'Keycloak no inició. Revisa logs Docker de keycloak.'}
Write-Host 'Abriendo los servicios Maven. Revisa cada terminal para confirmar el arranque.' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'ABRIR_APIS.ps1') -IncluirIndexer
& (Join-Path $PSScriptRoot 'ABRIR_DEMO.ps1')
Write-Host 'Angular disponible, pero los servicios requieren comprobación adicional:' -ForegroundColor Yellow
Write-Host 'Ejecuta .\infra\VERIFICAR.ps1 y revisa los logs Java.'
Write-Host 'Acceso: http://localhost:4200/inicio'
Write-Host 'Inicio de sesión: http://localhost:4200/login'
