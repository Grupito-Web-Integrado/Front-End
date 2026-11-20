param([switch]$Confirmar)
$ErrorActionPreference='Stop'
$envFile=Join-Path $PSScriptRoot '.env'
$compose=Join-Path $PSScriptRoot 'compose.yml'
if(-not(Test-Path $envFile)){throw 'Falta infra\.env, primero levanta la infraestructura.'}
. (Join-Path $PSScriptRoot 'COMPROBAR_DOCKER.ps1')
if(-not $Confirmar){
  Write-Host 'Solo prepara los campos firstName/lastName de las cuentas estudiante.myacademy y administrador.myacademy.' -ForegroundColor Cyan
  Write-Host 'NO cambia contraseñas, roles ni elimina usuarios. Ejecuta con -Confirmar para autorizarlo.'
  exit 0
}
$config=@{}
foreach($line in [IO.File]::ReadAllLines($envFile)){
  if($line -match '^\s*([^#=]+)=(.*)$'){$config[$matches[1].Trim()]=$matches[2].Trim()}
}
if(-not $config['KEYCLOAK_ADMIN_PASSWORD']){throw 'Falta credencial administrativa de Keycloak.'}
$common=@('compose','--env-file',$envFile,'-f',$compose,'exec','-T','keycloak','/opt/keycloak/bin/kcadm.sh')
& docker @common config credentials --server 'http://localhost:8080' --realm master --user $config['KEYCLOAK_ADMIN_USERNAME'] --password $config['KEYCLOAK_ADMIN_PASSWORD']
if($LASTEXITCODE -ne 0){throw 'No fue posible autenticar contra Keycloak. Comprueba Docker y http://localhost:8180/admin'}
foreach($account in @(
  @{username='estudiante.myacademy';firstName='Estudiante'},
  @{username='administrador.myacademy';firstName='Administrador'}
)){
  $raw=& docker @common get users -r myacademy -q ('username='+$account.username) --fields id,username,firstName,lastName
  if($LASTEXITCODE -ne 0){throw "No pudo consultarse $($account.username)."}
  $list=@(($raw -join [Environment]::NewLine) | ConvertFrom-Json)
  $matches=@($list|Where-Object {$_.username -eq $account.username})
  if($matches.Count -ne 1){Write-Warning "No se encontró exactamente una cuenta $($account.username); no se cambió.";continue}
  $id=[string]$matches[0].id
  if(-not $id -or $id -notmatch '^[0-9a-fA-F-]{36}$'){throw 'Identificador inválido de Keycloak.'}
  $first=[string]$matches[0].firstName
  $last=[string]$matches[0].lastName
  if(-not $first -or -not $last){
    $given=if($first){$first}else{$account.firstName}
    $family=if($last){$last}else{'MyAcademy'}
    & docker @common update ('users/'+$id) -r myacademy -s ('firstName='+$given) -s ('lastName='+$family)
    if($LASTEXITCODE -ne 0){throw "Error actualizando el perfil $($account.username)."}
    Write-Host ("Perfil completado: "+$account.username) -ForegroundColor Green
  }else{Write-Host ("Perfil ya completo: "+$account.username) -ForegroundColor Green}
}
Write-Host 'Usuarios conservan sus contraseñas, roles y sus datos restantes.'
