param([switch]$Catalogo,[switch]$Pagos)
$ErrorActionPreference='Stop'
if(-not $Catalogo -and -not $Pagos){ throw 'Elige -Catalogo o -Pagos (o ambos). Revisa PRs de microservicios antes de mezclar cambios.' }
$front=Split-Path $PSScriptRoot -Parent
$proyecto=Split-Path $front -Parent
$source=Join-Path $front 'integrations\backend-security'
function ValidarRepositorio($path) {
  if(-not(Test-Path (Join-Path $path '.git'))){throw "No se encontró repo clonado: $path"}
  $changes=git -C $path status --porcelain
  if ($LASTEXITCODE -ne 0 -or $changes) { throw "Hay cambios locales en $path. Respáldalos antes de aplicar la seguridad." }
}
function CopiarConRespaldo($sourceFile,$destFile,$backup){
  New-Item -ItemType Directory -Force -Path (Split-Path $destFile) | Out-Null
  if(Test-Path $destFile){ Copy-Item $destFile (Join-Path $backup ([IO.Path]::GetFileName($destFile))) -Force }
  Copy-Item $sourceFile $destFile -Force
}
if($Catalogo){
  $repo=Join-Path $proyecto 'Catalogo-Cursos-Publico-1A'
  ValidarRepositorio $repo
  $backup=Join-Path $proyecto ('respaldo-seguridad-catalogo-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  CopiarConRespaldo (Join-Path $source 'catalogo\SecurityConfig.java') (Join-Path $repo 'src\main\java\com\example\Catalogo_Cursos\infrastructure\config\SecurityConfig.java') $backup
  CopiarConRespaldo (Join-Path $source 'catalogo\application-keycloak.yaml') (Join-Path $repo 'src\main\resources\application-keycloak.yaml') $backup
  Write-Host "Catálogo adaptado en local. Respaldo: $backup" -ForegroundColor Green
}
if($Pagos){
  $repo=Join-Path $proyecto 'Estados_de_Pago'
  ValidarRepositorio $repo
  $backup=Join-Path $proyecto ('respaldo-seguridad-pagos-'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  Copy-Item (Join-Path $repo 'pom.xml') (Join-Path $backup 'pom.xml')
  CopiarConRespaldo (Join-Path $source 'pagos\SecurityConfig.java') (Join-Path $repo 'src\main\java\com\example\Servicio_Pago\config\SecurityConfig.java') $backup
  CopiarConRespaldo (Join-Path $source 'pagos\application-keycloak.properties') (Join-Path $repo 'src\main\resources\application-keycloak.properties') $backup
  $pomPath=Join-Path $repo 'pom.xml'
  $pom=[IO.File]::ReadAllText($pomPath)
  foreach($artifact in @('spring-boot-starter-security','spring-boot-starter-oauth2-resource-server')){
    if(-not $pom.Contains("<artifactId>$artifact</artifactId>")){
      $dependency="        <dependency>`n            <groupId>org.springframework.boot</groupId>`n            <artifactId>$artifact</artifactId>`n        </dependency>`n"
      $pom=$pom.Replace('</dependencies>',$dependency+'    </dependencies>')
    }
  }
  [IO.File]::WriteAllText($pomPath,$pom,(New-Object System.Text.UTF8Encoding($false)))
  $controller=Join-Path $repo 'src\main\java\com\example\Servicio_Pago\controller\PagoController.java'
  $controllerText=[IO.File]::ReadAllText($controller)
  if($controllerText.Contains('@CrossOrigin(origins = "*")')){
    Copy-Item $controller (Join-Path $backup 'PagoController.java')
    $controllerText=$controllerText.Replace('@CrossOrigin(origins = "*")','')
    [IO.File]::WriteAllText($controller,$controllerText,(New-Object System.Text.UTF8Encoding($false)))
  }
  Write-Host "Pagos adaptado en local. Respaldo: $backup" -ForegroundColor Green
}
Write-Host 'Revisa git diff en cada backend. Ejecuta Maven y crea PR independiente; no publiques cambios sin revisión de tu equipo.'
