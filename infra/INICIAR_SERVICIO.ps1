param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('catalogo','matricula','pagos','indexer')]
  [string] $Servicio
)
$ErrorActionPreference='Stop'
$front = Split-Path $PSScriptRoot -Parent
$proyecto = Split-Path $front -Parent
$envfile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envfile)) { throw 'Ejecuta primero infra\INICIAR_INFRA.ps1.' }
$cfg = @{}
foreach($line in [System.IO.File]::ReadAllLines($envfile)){
  if($line -match '^\s*([^#=]+)=(.*)$') { $cfg[$matches[1].Trim()] = $matches[2].Trim() }
}
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Instala JDK 21 y configura JAVA_HOME antes de ejecutar Maven.' }
$folders=@{
  catalogo='Catalogo-Cursos-Publico-1A'
  matricula='Matricula-Publico_1E'
  pagos='Estados_de_Pago'
  indexer='Catalog-Indexer-'
}
$path = Join-Path $proyecto $folders[$Servicio]
if (-not (Test-Path (Join-Path $path 'mvnw.cmd'))) { throw "Repositorio faltante: $path. Ejecuta INICIAR_INFRA.ps1 -PrepararRepos." }
switch($Servicio) {
  'catalogo' {
    $env:SERVER_PORT='8080'
    $env:SPRING_R2DBC_URL='r2dbc:postgresql://localhost:5435/catalog_db'
    $env:SPRING_R2DBC_USERNAME='admin'
    $env:SPRING_R2DBC_PASSWORD=$cfg['CATALOG_DB_PASSWORD']
    $env:SPRING_FLYWAY_URL='jdbc:postgresql://localhost:5435/catalog_db'
    $env:SPRING_FLYWAY_USER='admin'
    $env:SPRING_FLYWAY_PASSWORD=$cfg['CATALOG_DB_PASSWORD']
    $env:SPRING_ELASTICSEARCH_URIS='http://localhost:9200'
    $env:SPRING_DATA_REDIS_HOST='localhost'
    $env:SPRING_DATA_REDIS_PORT='6379'
    $env:SPRING_KAFKA_BOOTSTRAP_SERVERS='localhost:9092'
    $env:SPRING_PROFILES_ACTIVE='keycloak'
    $env:KEYCLOAK_ISSUER_URI='http://localhost:8180/realms/myacademy'
    $env:KEYCLOAK_JWK_SET_URI='http://localhost:8180/realms/myacademy/protocol/openid-connect/certs'
  }
  'matricula' {
    $env:SERVER_PORT='8082'
    $env:SPRING_R2DBC_URL='r2dbc:postgresql://localhost:5436/matricula_db'
    $env:SPRING_R2DBC_USERNAME='admin'
    $env:SPRING_R2DBC_PASSWORD=$cfg['MATRICULA_DB_PASSWORD']
    $env:SPRING_FLYWAY_URL='jdbc:postgresql://localhost:5436/matricula_db'
    $env:SPRING_FLYWAY_USER='admin'
    $env:SPRING_FLYWAY_PASSWORD=$cfg['MATRICULA_DB_PASSWORD']
    $env:SPRING_KAFKA_BOOTSTRAP_SERVERS='localhost:9092'
    $env:SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI='http://localhost:8180/realms/myacademy'
    $env:SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI='http://localhost:8180/realms/myacademy/protocol/openid-connect/certs'
  }
  'pagos' {
    $env:SERVER_PORT='8081'
    $env:SPRING_PROFILES_ACTIVE='keycloak'
    $env:KEYCLOAK_ISSUER_URI='http://localhost:8180/realms/myacademy'
    $env:KEYCLOAK_JWK_SET_URI='http://localhost:8180/realms/myacademy/protocol/openid-connect/certs'
  }
  'indexer' {
    $env:SERVER_PORT='8084'
    $env:SPRING_KAFKA_BOOTSTRAP_SERVERS='localhost:9092'
    $env:SPRING_ELASTICSEARCH_URIS='http://localhost:9200'
  }
}
Set-Location $path
Write-Host "Iniciando $Servicio desde $path. Presiona Ctrl+C para detenerlo."
& '.\mvnw.cmd' spring-boot:run
if ($LASTEXITCODE -ne 0) { throw "Error al iniciar $Servicio. Revisa el log de Maven." }
