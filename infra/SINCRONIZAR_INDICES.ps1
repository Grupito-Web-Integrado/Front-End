param([switch]$Continuo,[int]$IntervaloSegundos=15)
$ErrorActionPreference='Stop'
$compose=Join-Path $PSScriptRoot 'compose.yml'
$envfile=Join-Path $PSScriptRoot '.env'
if(-not(Test-Path $envfile)){throw 'Infraestructura sin .env. Ejecuta INICIAR_INFRA.ps1.'}
$base='http://localhost:9200'
function LeerTabla([string]$sql){
  $raw=& docker compose --env-file $envfile -f $compose exec -T catalogo-db psql -v ON_ERROR_STOP=1 -U admin -d catalog_db -At -c $sql
  if($LASTEXITCODE -ne 0){throw 'No pudo consultarse PostgreSQL. Asegúrate de que Catálogo aplicó Flyway.'}
  $json=($raw -join [Environment]::NewLine).Trim()
  if(-not $json){return @()}
  $rows=ConvertFrom-Json -InputObject $json
  return ,@($rows)
}
function Sincronizar {
  # Leer modelo de SQL del microservicio original; no usa mocks ni modifica PostgreSQL.
  $categorias=@'
SELECT coalesce(json_agg(json_build_object('courseCategoryId',id::text,'name',name,'description',description,'status',status)),'[]'::json)::text
FROM course_categories WHERE deleted=FALSE;
'@
  $cursos=@'
SELECT coalesce(json_agg(json_build_object(
 'id',id::text,'courseId',id::text,'courseCategoryId',category_id::text,
 'categories',json_build_array(category_id::text),
 'code',code,'name',name,'description',description,
 'modality',modality,'price',price,'currency',currency,
 'startDate',start_date::text,'endDate',end_date::text,'startTime',start_time::text,
 'durationHours',duration_hours,'capacity',capacity,'availableSlots',available_slots,
 'status',status)),'[]'::json)::text
FROM courses WHERE deleted=FALSE;
'@
  $horarios=@'
SELECT coalesce(json_agg(json_build_object(
 'id',id::text,'courseId',course_id::text,'dayOfWeek',day_of_week,
 'startTime',start_time::text,'endTime',end_time::text,'room',room)),'[]'::json)::text
FROM course_schedules WHERE deleted=FALSE;
'@
  $sedes=@'
SELECT coalesce(json_agg(json_build_object(
 'id',id::text,'courseId',course_id::text,'name',name,
 'address',address,'city',city,'reference',reference,'capacity',capacity)),'[]'::json)::text
FROM course_locations WHERE deleted=FALSE;
'@
  foreach($item in @(
    @{index='course_categories';key='courseCategoryId';sql=$categorias},
    @{index='courses';key='id';sql=$cursos},
    @{index='course_schedules';key='id';sql=$horarios},
    @{index='course_locations';key='id';sql=$sedes}
  )){
    $count=0
    $records=LeerTabla $item.sql
    foreach($row in $records){
      if($null -eq $row){continue}
      $id=[string]$row.($item.key)
      if(-not $id){throw "Documento en $($item.index) sin clave"}
      $uri="$base/$($item.index)/_doc/$([uri]::EscapeDataString($id))?refresh=wait_for"
      $body=ConvertTo-Json -InputObject $row -Depth 20 -Compress
      $null=Invoke-RestMethod -Uri $uri -Method Put -ContentType 'application/json; charset=utf-8' -Body $body -TimeoutSec 20
      $count++
    }
    Write-Host "$($item.index): $count documentos reales sincronizados" -ForegroundColor Green
  }
}
if($Continuo){
  Write-Warning 'Sincronizador temporal de desarrollo. Ctrl+C lo detiene. No usar en producción ni junto con una proyección concurrente sin coordinación.'
  do{
    try{Sincronizar}catch{Write-Warning $_.Exception.Message}
    Start-Sleep -Seconds ([Math]::Max(5,$IntervaloSegundos))
  }while($true)
}else{Sincronizar}
