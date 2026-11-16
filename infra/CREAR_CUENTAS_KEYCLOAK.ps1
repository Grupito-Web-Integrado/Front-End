param([switch]$Confirmar,[switch]$SinMostrarClaves)
$ErrorActionPreference='Stop'
$envFile=Join-Path $PSScriptRoot '.env'
$compose=Join-Path $PSScriptRoot 'compose.yml'
if(-not(Test-Path $envFile)){throw 'Primero ejecuta INICIAR_INFRA.ps1 y espera Keycloak.'}
. (Join-Path $PSScriptRoot 'COMPROBAR_DOCKER.ps1')
$realmDiscovery='http://localhost:8180/realms/myacademy/.well-known/openid-configuration'
try {
  $realmResponse=Invoke-WebRequest -UseBasicParsing -Uri $realmDiscovery -TimeoutSec 8
  if($realmResponse.StatusCode -ne 200) {throw 'OIDC no disponible'}
} catch {
  throw 'Keycloak aun no responde en localhost:8180. Ejecuta ABRIR_MYACADEMY.bat, verifica docker compose ps y vuelve a intentar crear cuentas.'
}
if(-not $Confirmar){
  Write-Host 'Este script crea DOS CUENTAS REALES de Keycloak para validación local:' -ForegroundColor Cyan
  Write-Host '  - estudiante.myacademy (rol ESTUDIANTE)'
  Write-Host '  - administrador.myacademy (rol ADMIN)'
  Write-Host 'Genera claves aleatorias; no modifica usuarios existentes ni archivos de GitHub.'
  Write-Host 'Para ejecutar: .\infra\CREAR_CUENTAS_KEYCLOAK.ps1 -Confirmar'
  exit 0
}
$cfg=@{}
foreach($line in [IO.File]::ReadAllLines($envFile)){
  if($line -match '^\s*([^#=]+)=(.*)$'){$cfg[$matches[1].Trim()]=$matches[2].Trim()}
}
if(-not $cfg.ContainsKey('KEYCLOAK_ADMIN_PASSWORD')){throw 'No se encontró la contraseña administrativa en infra\.env'}
$common=@('compose','--env-file',$envFile,'-f',$compose,'exec','-T','keycloak','/opt/keycloak/bin/kcadm.sh')
& docker @common config credentials --server 'http://localhost:8080' --realm 'master' --user $cfg['KEYCLOAK_ADMIN_USERNAME'] --password $cfg['KEYCLOAK_ADMIN_PASSWORD']
if($LASTEXITCODE -ne 0){throw 'Autenticación con kcadm falló. Comprueba Keycloak y la contraseña local.'}
function NuevaClave {
  $bytes=New-Object byte[] 24
  $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
  try {$rng.GetBytes($bytes)} finally {$rng.Dispose()}
  return ([BitConverter]::ToString($bytes)).Replace('-','')
}
$usuarios=@(
  @{nombre='estudiante.myacademy';rol='ESTUDIANTE'},
  @{nombre='administrador.myacademy';rol='ADMIN'}
)
# No modificar cuentas preexistentes; evitar reinicios inesperados de sus contraseñas.
foreach($u in $usuarios){
  $raw=& docker @common get users -r myacademy -q ('username='+$u.nombre) --fields id,username
  if($LASTEXITCODE -ne 0){throw "No fue posible consultar el usuario $($u.nombre)"}
  $json=$raw -join [Environment]::NewLine
  $list=@($json | ConvertFrom-Json)
  if(@($list|Where-Object {$_.username -eq $u.nombre}).Count -gt 0){
    throw "La cuenta $($u.nombre) ya existe. Por seguridad no se reemplaza ni restablece contraseña."
  }
}
$result=@()
foreach($u in $usuarios){
  $pwd=NuevaClave
  & docker @common create users -r myacademy -s ('username='+$u.nombre) -s 'enabled=true' -s 'emailVerified=true'
  if($LASTEXITCODE -ne 0){throw "No se pudo crear $($u.nombre)"}
  & docker @common set-password -r myacademy --username $u.nombre --new-password $pwd
  if($LASTEXITCODE -ne 0){throw "No se pudo definir contraseña para $($u.nombre)"}
  & docker @common add-roles -r myacademy --uusername $u.nombre --rolename $u.rol
  if($LASTEXITCODE -ne 0){throw "No se pudo asignar rol $($u.rol) al usuario $($u.nombre)"}
  $result+=@{Usuario=$u.nombre;Rol=$u.rol;Clave=$pwd}
}
Write-Host 'Cuentas creadas en el realm myacademy con los roles solicitados.' -ForegroundColor Green
if(-not $SinMostrarClaves){
  foreach($u in $result){
    Write-Host ("Usuario: "+$u.Usuario+" | Rol: "+$u.Rol+" | Contraseña: "+$u.Clave) -ForegroundColor Cyan
  }
  Write-Host 'Guarda las contraseñas fuera de GitHub y cámbialas antes de usar este entorno con otras personas.' -ForegroundColor Yellow
}
