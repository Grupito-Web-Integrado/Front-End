param([switch]$Confirmar)
$ErrorActionPreference='Stop'
$envfile=Join-Path $PSScriptRoot '.env'
$compose=Join-Path $PSScriptRoot 'compose.yml'
$seed=Join-Path $PSScriptRoot 'fixtures\demo-catalog.sql'
if(-not $Confirmar){
  Write-Host 'Este paso agrega 35 cursos y 11 categorías FICTICIAS a PostgreSQL local.' -ForegroundColor Yellow
  Write-Host 'Para realizarlo: .\infra\CARGAR_CURSOS_DEMO_EN_BD.ps1 -Confirmar'
  exit 0
}
if(-not(Test-Path $envfile)){throw 'Necesitas ejecutar primero INICIAR_INFRA.ps1.'}
if(-not(Test-Path $seed)){throw 'No se encontró el archivo SQL.'}
$id=(& docker compose --env-file $envfile -f $compose ps -q catalogo-db | Select-Object -First 1)
if($LASTEXITCODE -ne 0 -or -not $id){throw 'No se encontró PostgreSQL de Catálogo en Docker.'}
& docker cp $seed ($id + ':/tmp/myacademy-demo-catalog.sql')
if($LASTEXITCODE -ne 0){throw 'No se pudo copiar el SQL al contenedor.'}
& docker compose --env-file $envfile -f $compose exec -T catalogo-db psql -v ON_ERROR_STOP=1 -U admin -d catalog_db -f /tmp/myacademy-demo-catalog.sql
if($LASTEXITCODE -ne 0){throw 'Falló la carga: revisa migraciones de Catálogo, incluida V3.'}
Write-Host 'Registros DEMO en PostgreSQL; sincronizando Elasticsearch...' -ForegroundColor Green
& (Join-Path $PSScriptRoot 'SINCRONIZAR_INDICES.ps1')
if(-not $?){throw 'Sincronización fallida.'}
