param([switch]$Confirmar)
$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
$repo=Join-Path (Split-Path $front -Parent) 'Catalogo-Cursos-Publico-1A'
if(-not(Test-Path (Join-Path $repo '.git'))){throw "No existe: $repo"}
$dirty=git -C $repo status --porcelain
if($LASTEXITCODE -ne 0 -or $dirty){throw 'Repositorio con cambios pendientes: no se alteró.'}
if(-not $Confirmar) {
 Write-Host 'Se aplicará un parche local al Outbox y Flyway. Ejecuta con -Confirmar para autorizarlo.' -ForegroundColor Yellow
 exit 0
}
$source=Join-Path $front 'integrations\catalogo-outbox'
$mapping=@(
 @{source='V3__fix_outbox_and_modalities.sql';dest='src\main\resources\db\migration\V3__fix_outbox_and_modalities.sql'},
 @{source='SpringDataOutboxRepository.java';dest='src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\repository\SpringDataOutboxRepository.java'},
 @{source='OutboxEventPublisherImpl.java';dest='src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\outbox\publisher\OutboxEventPublisherImpl.java'},
 @{source='OutboxKafkaConfig.java';dest='src\main\java\com\example\Catalogo_Cursos\infrastructure\input\rest\outbox\publisher\OutboxKafkaConfig.java'},
 @{source='CourseElasticsearchRepositoryImpl.java';dest='src\main\java\com\example\Catalogo_Cursos\infrastructure\output\search\elastic\adapter\CourseElasticsearchRepositoryImpl.java'},
 @{source='CourseCreatedEvent.java';dest='src\main\java\com\example\Catalogo_Cursos\domain\model\course\event\CourseCreatedEvent.java'},
 @{source='Course.java';dest='src\main\java\com\example\Catalogo_Cursos\domain\model\course\Course.java'}
)
$backup=Join-Path (Split-Path $repo -Parent) ('respaldo-outbox-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach($item in $mapping){
 $target=Join-Path $repo $item.dest
 if(Test-Path $target){Copy-Item $target (Join-Path $backup $item.source) -Force}
 New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
 Copy-Item (Join-Path $source $item.source) $target -Force
}
Write-Host "Parche aplicado al repo local. Respaldos en $backup"
Write-Host 'Revisa git diff y crea PR al repositorio del backend con el compañero.'
