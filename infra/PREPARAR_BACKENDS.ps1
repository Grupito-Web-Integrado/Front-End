param([switch]$Confirmar)
$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
$root=Split-Path $front -Parent
$branch='feat/myacademy-integracion-local'
$repos=@(
  @{name='Catalogo-Cursos-Publico-1A';url='https://github.com/Grupito-Web-Integrado/Catalogo-Cursos-Publico-1A.git'},
  @{name='Matricula-Publico_1E';url='https://github.com/Grupito-Web-Integrado/Matricula-Publico_1E.git'},
  @{name='Estados_de_Pago';url='https://github.com/Grupito-Web-Integrado/Estados_de_Pago.git'}
)
if(-not (Get-Command git -ErrorAction SilentlyContinue)){throw 'Git no está instalado.'}
foreach($r in $repos){
  $dir=Join-Path $root $r.name
  if(Test-Path $dir){
    if(-not(Test-Path (Join-Path $dir '.git'))){throw "$dir existe sin .git; no se sobreescribe."}
    $dirty=@(git -C $dir status --porcelain)
    if($LASTEXITCODE -ne 0){throw "No se puede revisar git status: $dir"}
    if($dirty.Count -gt 0){throw "$dir tiene cambios locales. Haz commit o respaldo antes de continuar."}
    $current=(& git -C $dir branch --show-current).Trim()
    $exists=@(git -C $dir branch --list $branch)
    if($current -eq $branch){throw "$dir ya está en rama $branch. No se aplica por segunda vez."}
    if($exists.Count -gt 0){throw "$dir ya contiene rama $branch. Revísala antes."}
  }
}
if(-not $Confirmar){
  Write-Host 'Solo plan: se crearán ramas LOCALES aisladas en Catálogo, Matrículas y Pagos.' -ForegroundColor Cyan
  Write-Host 'No se subirá nada a GitHub. No se borrarán archivos ni se tocarán ramas remotas.'
  Write-Host 'Para autorizar: .\infra\PREPARAR_BACKENDS.ps1 -Confirmar' -ForegroundColor Yellow
  exit 0
}
$backup=Join-Path $root ('respaldo-myacademy-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
function Copiar([string]$fuente,[string]$destino,[string]$nombre){
  if(-not(Test-Path $fuente)){throw "Falta parche: $fuente"}
  New-Item -ItemType Directory -Path (Split-Path $destino) -Force | Out-Null
  if(Test-Path $destino){
    $relative=$destino.Substring((Join-Path $root $nombre).Length).TrimStart('\')
    $copia=Join-Path (Join-Path $backup $nombre) $relative
    New-Item -ItemType Directory -Path (Split-Path $copia) -Force | Out-Null
    Copy-Item -LiteralPath $destino -Destination $copia -Force
  }
  Copy-Item -LiteralPath $fuente -Destination $destino -Force
}
foreach($r in $repos){
  $dir=Join-Path $root $r.name
  if(-not(Test-Path $dir)){
    git clone -- $r.url $dir
    if($LASTEXITCODE -ne 0){throw "Error git clone de $($r.name)"}
  }
  git -C $dir switch -c $branch
  if($LASTEXITCODE -ne 0){throw "No se pudo crear rama local en $dir"}
}
$source=Join-Path $front 'integrations'
$cat='Catalogo-Cursos-Publico-1A'
$catalogo=@(
  @('catalogo-outbox\V3__fix_outbox_and_modalities.sql','src\main\resources\db\migration\V3__fix_outbox_and_modalities.sql'),
  @('catalogo-outbox\SpringDataOutboxRepository.java','src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\repository\SpringDataOutboxRepository.java'),
  @('catalogo-outbox\OutboxEventPublisherImpl.java','src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\outbox\publisher\OutboxEventPublisherImpl.java'),
  @('catalogo-outbox\OutboxKafkaConfig.java','src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\outbox\publisher\OutboxKafkaConfig.java'),
  @('catalogo-outbox\CourseElasticsearchRepositoryImpl.java','src\main\java\com\example\Catalogo_Cursos\infrastructure\output\search\elastic\adapter\CourseElasticsearchRepositoryImpl.java'),
  @('catalogo-outbox\CourseCreatedEvent.java','src\main\java\com\example\Catalogo_Cursos\domain\model\course\event\CourseCreatedEvent.java'),
  @('catalogo-outbox\Course.java','src\main\java\com\example\Catalogo_Cursos\domain\model\course\Course.java'),
  @('backend-security\catalogo\SecurityConfig.java','src\main\java\com\example\Catalogo_Cursos\infrastructure\config\SecurityConfig.java'),
  @('backend-security\catalogo\application-keycloak.yaml','src\main\resources\application-keycloak.yaml')
)
foreach($item in $catalogo){Copiar (Join-Path $source $item[0]) (Join-Path (Join-Path $root $cat) $item[1]) $cat}
$mat='Matricula-Publico_1E'
foreach($name in @('EnrollmentRestController.java','EnrollmentSecurityConfig.java')){
  $dest='src\main\java\com\example\Matricula_Pedidos\integration\web\'+$name
  Copiar (Join-Path $source ('matricula-api\'+$name)) (Join-Path (Join-Path $root $mat) $dest) $mat
}
foreach($name in @('StudentName.java','StudentEmail.java','StudentPhone.java','DocumentNumber.java')){
  $dest='src\main\java\com\example\Matricula_Pedidos\domain\model\enrollments\enrollment_students\vo\'+$name
  Copiar (Join-Path $source ('matricula-api\compat\'+$name)) (Join-Path (Join-Path $root $mat) $dest) $mat
}
$pay='Estados_de_Pago'
foreach($item in @(
 @('backend-security\pagos\SecurityConfig.java','src\main\java\com\example\Servicio_Pago\config\SecurityConfig.java'),
 @('backend-security\pagos\application-keycloak.properties','src\main\resources\application-keycloak.properties')
)){Copiar (Join-Path $source $item[0]) (Join-Path (Join-Path $root $pay) $item[1]) $pay}
$pom=Join-Path (Join-Path $root $pay) 'pom.xml'
Copy-Item $pom (Join-Path $backup 'pagos-original-pom.xml') -Force
$txt=[IO.File]::ReadAllText($pom)
foreach($artifact in @('spring-boot-starter-security','spring-boot-starter-oauth2-resource-server')){
  if(-not $txt.Contains("<artifactId>$artifact</artifactId>")){
    $dep='  <dependency><groupId>org.springframework.boot</groupId><artifactId>'+$artifact+'</artifactId></dependency>'+[Environment]::NewLine
    $txt=$txt.Replace('</dependencies>',$dep+'</dependencies>')
  }
}
[IO.File]::WriteAllText($pom,$txt,(New-Object System.Text.UTF8Encoding($false)))
$ctrl=Join-Path (Join-Path $root $pay) 'src\main\java\com\example\Servicio_Pago\controller\PagoController.java'
if(Test-Path $ctrl){
  $raw=[IO.File]::ReadAllText($ctrl)
  if($raw.Contains('@CrossOrigin(origins = "*")')){
    Copy-Item $ctrl (Join-Path $backup 'pagos-original-PagoController.java') -Force
    [IO.File]::WriteAllText($ctrl,$raw.Replace('@CrossOrigin(origins = "*")',''),(New-Object System.Text.UTF8Encoding($false)))
  }
}
Write-Host 'Parche aplicado en tres ramas locales. Sin push a GitHub.' -ForegroundColor Green
Write-Host ("Respaldo: "+$backup)
Write-Host 'Revisa git diff en cada microservicio y crea PR separados con tu equipo.'
Write-Host 'Siguiente: .\infra\INICIAR_TODO.ps1 -Modo Api' -ForegroundColor Cyan
