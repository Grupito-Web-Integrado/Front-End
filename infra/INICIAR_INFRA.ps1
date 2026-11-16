param(
  [switch] $ConKafka,
  [switch] $ConObservabilidad,
  [switch] $PrepararRepos
)
$ErrorActionPreference = 'Stop'
$infra = $PSScriptRoot
$front = Split-Path $infra -Parent
$proyecto = Split-Path $front -Parent
$envfile = Join-Path $infra '.env'
function NuevaClave {
  $bytes = New-Object byte[] 24
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return [Convert]::ToBase64String($bytes)
}
if (-not (Test-Path $envfile)) {
  $content = @(
    "CATALOG_DB_PASSWORD=$(NuevaClave)"
    "MATRICULA_DB_PASSWORD=$(NuevaClave)"
    "KEYCLOAK_DB_PASSWORD=$(NuevaClave)"
    'KEYCLOAK_ADMIN_USERNAME=admin'
    "KEYCLOAK_ADMIN_PASSWORD=$(NuevaClave)"
  ) -join [Environment]::NewLine
  [System.IO.File]::WriteAllText($envfile, $content + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Configuracion privada generada en $envfile" -ForegroundColor Green
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker no esta disponible. Abre Docker Desktop y comprueba: docker version"
}
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw 'El motor Docker no responde. Inicia Docker Desktop.' }
if ($PrepararRepos -or $ConKafka) {
  $repos = @(
    @{ folder='Catalogo-Cursos-Publico-1A'; url='https://github.com/Grupito-Web-Integrado/Catalogo-Cursos-Publico-1A.git' },
    @{ folder='Matricula-Publico_1E'; url='https://github.com/Grupito-Web-Integrado/Matricula-Publico_1E.git' },
    @{ folder='Estados_de_Pago'; url='https://github.com/Grupito-Web-Integrado/Estados_de_Pago.git' },
    @{ folder='Catalog-Indexer-'; url='https://github.com/Grupito-Web-Integrado/Catalog-Indexer-.git' }
  )
  foreach($r in $repos) {
    $dest = Join-Path $proyecto $r.folder
    if (-not (Test-Path $dest)) {
      Write-Host "Clonando $($r.folder)..."
      git clone $r.url $dest
      if ($LASTEXITCODE -ne 0) { throw "Falló git clone de $($r.folder)" }
    } else { Write-Host "Se conserva el repositorio existente: $dest" }
  }
}
$compose = Join-Path $infra 'compose.yml'
$args = @('compose','--env-file',$envfile,'-f',$compose)
if($ConObservabilidad){ $args += @('--profile','observabilidad') }
& docker @args config --quiet
if ($LASTEXITCODE -ne 0) { throw 'Error en Docker Compose. No se han iniciado contenedores.' }
& docker @args up -d
if ($LASTEXITCODE -ne 0) { throw 'Fallo al arrancar la infraestructura principal.' }
# La API de Catálogo consulta índices de Elasticsearch desde el primer GET.
& (Join-Path $infra 'INICIALIZAR_INDICES.ps1')
if(-not $?){throw 'Falló la inicialización de índices Elasticsearch.'}
if ($ConKafka) {
  $kafka = Join-Path $proyecto 'Catalogo-Cursos-Publico-1A\docker\kafka\docker-compose.yml'
  if (-not (Test-Path $kafka)) { throw "No se encontró el compose Kafka del catálogo: $kafka" }
  docker compose -f $kafka up -d
  if ($LASTEXITCODE -ne 0) { throw 'Fallo al arrancar Kafka en el repositorio de catálogo.' }
}
Write-Host 'Infraestructura iniciada. Espera el estado healthy de Keycloak y PostgreSQL.' -ForegroundColor Green
Write-Host 'Keycloak: http://localhost:8180/admin'
Write-Host 'El usuario admin inicial se define en infra\.env; no compartas ese archivo.'
Write-Host 'Postgres catálogo: localhost:5435 | Matrículas: localhost:5436'
Write-Host 'Redis: localhost:6379 | Elasticsearch: http://localhost:9200'
if ($ConKafka) { Write-Host 'Kafka UI: http://localhost:8090 | Brokers: 9092, 9093, 9094' }
if ($ConObservabilidad) { Write-Host 'Jaeger: http://localhost:16686' }
