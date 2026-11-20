$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
$proyecto=Split-Path $front -Parent
$envfile=Join-Path $PSScriptRoot '.env'
if(-not (Test-Path $envfile)){throw 'No existe infra\.env. No se encontró el entorno configurado.'}
$kafka=Join-Path $proyecto 'Catalogo-Cursos-Publico-1A\docker\kafka\docker-compose.yml'
if(Test-Path $kafka){
  docker compose -f $kafka down
  if($LASTEXITCODE -ne 0){Write-Warning 'No se pudo detener Kafka. Comprueba Docker Desktop.'}
}
docker compose --env-file $envfile -f (Join-Path $PSScriptRoot 'compose.yml') down
if($LASTEXITCODE -ne 0){ throw 'Error al detener la infraestructura.' }
Write-Host 'Contenedores detenidos. No se eliminaron volúmenes ni bases de datos.' -ForegroundColor Green
Write-Host 'Para detener Angular y Java pulsa Ctrl+C en sus respectivas terminales.'
