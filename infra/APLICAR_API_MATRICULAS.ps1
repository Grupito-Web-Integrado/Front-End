param([switch]$Confirmar)
$ErrorActionPreference='Stop'
$front=Split-Path $PSScriptRoot -Parent
$repo=Join-Path (Split-Path $front -Parent) 'Matricula-Publico_1E'
if(-not (Test-Path (Join-Path $repo '.git'))){throw "Falta el repositorio $repo"}
$dirty=git -C $repo status --porcelain
if($LASTEXITCODE -ne 0 -or $dirty){throw 'El repositorio de Matrículas tiene cambios sin guardar; no se modifica.'}
if(-not $Confirmar) {
  Write-Host 'Se agregarán dos adaptadores Java al repo local, sin modificar GitHub.' -ForegroundColor Yellow
  Write-Host 'Ejecuta nuevamente con -Confirmar después de revisar el código.'
  exit 0
}
$source=Join-Path $front 'integrations\matricula-api'
$dest=Join-Path $repo 'src\main\java\com\example\Matricula_Pedidos\integration\web'
New-Item -ItemType Directory -Force $dest | Out-Null
foreach($name in @('EnrollmentRestController.java','EnrollmentSecurityConfig.java')) {
  $file=Join-Path $dest $name
  if(Test-Path $file){throw "No se sobrescribe archivo existente: $file"}
  Copy-Item (Join-Path $source $name) $file
}
$compatSource=Join-Path $source 'compat'
$compatDest=Join-Path $repo 'src\main\java\com\example\Matricula_Pedidos\domain\model\enrollments\enrollment_students\vo'
$backup=Join-Path (Split-Path $repo -Parent) ("backup-matricula-vo-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach($name in @('StudentName.java','StudentEmail.java','StudentPhone.java','DocumentNumber.java')){
  Copy-Item (Join-Path $compatDest $name) (Join-Path $backup $name) -Force
  Copy-Item (Join-Path $compatSource $name) (Join-Path $compatDest $name) -Force
}
Write-Host "Backups de objetos de valor en: $backup"
Write-Host 'Adaptador REST copiado: revisa git diff y valida Maven.' -ForegroundColor Green
