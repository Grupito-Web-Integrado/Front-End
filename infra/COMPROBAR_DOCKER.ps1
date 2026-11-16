# Dot-source para comprobar o intentar iniciar Docker Desktop (motor Linux).
if(-not(Get-Command docker -ErrorAction SilentlyContinue)) {
  throw 'Docker CLI no encontrado. Instala Docker Desktop para Windows y activa contenedores Linux.'
}
function Test-DockerLinux {
  try {
    $result=(& docker info --format '{{.OSType}}' 2>&1 | Out-String)
    return ($LASTEXITCODE -eq 0 -and $result.Trim() -eq 'linux')
  } catch {return $false}
}
if(-not (Test-DockerLinux)) {
  $isWindows = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
  if($isWindows) {
    $desktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if(Test-Path $desktop) {
      if(-not(Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue)) {
        Write-Host 'Iniciando Docker Desktop...' -ForegroundColor Cyan
        Start-Process -FilePath $desktop
      }
      Write-Host 'Comprobando que el motor Linux de Docker Desktop responda...' -ForegroundColor Yellow
      for($attempt=0; $attempt -lt 50; $attempt++) {
        if(Test-DockerLinux) {break}
        Start-Sleep -Seconds 2
      }
    }
  }
}
if(-not(Test-DockerLinux)) {
  throw 'Docker Linux no responde (pipe dockerDesktopLinuxEngine). Abre Docker Desktop, confirma "Engine running", usa Linux containers y verifica docker info. No es un error de Keycloak.'
}
Write-Host 'Docker Linux: motor disponible.' -ForegroundColor Green
