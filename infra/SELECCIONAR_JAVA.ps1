# Selecciona un JDK completo SOLO para la sesion PowerShell actual.
# java.exe puede apuntar a Oracle javapath (JRE), que no contiene javac.exe.
# Por eso buscamos instalaciones completas e inspeccionamos ambos ejecutables.
$javaCandidates = New-Object 'System.Collections.Generic.List[string]'
$jdkPaths = @($env:JDK21_HOME, $env:JAVA21_HOME, $env:JAVA_HOME)
foreach($jdkPath in $jdkPaths){
  if(-not [string]::IsNullOrWhiteSpace($jdkPath)){
    $javaCandidates.Add((Join-Path $jdkPath 'bin\java.exe'))
  }
}
foreach($cmdName in @('javac.exe','java.exe')){
  foreach($command in @(Get-Command $cmdName -All -ErrorAction SilentlyContinue)){
    if($command.Source){$javaCandidates.Add($command.Source)}
  }
}
$rootNames = @('Eclipse Adoptium','Java','Microsoft','Amazon Corretto','Zulu','BellSoft','Azul Systems')
foreach($base in @($env:ProgramFiles, $env:LOCALAPPDATA, ${env:ProgramFiles(x86)})){
  if([string]::IsNullOrWhiteSpace($base)) {continue}
  foreach($rootName in $rootNames){
    $roots = @((Join-Path $base $rootName),(Join-Path (Join-Path $base 'Programs') $rootName))
    foreach($rootPath in $roots){
      if(-not(Test-Path -LiteralPath $rootPath -PathType Container)){continue}
      foreach($folder in @(Get-ChildItem -LiteralPath $rootPath -Directory -ErrorAction SilentlyContinue)){
        $javaCandidates.Add((Join-Path $folder.FullName 'bin\java.exe'))
      }
    }
  }
}
$found = $null
foreach($candidate in @($javaCandidates | Select-Object -Unique)){
  if(-not(Test-Path -LiteralPath $candidate -PathType Leaf)){continue}
  # java.exe y javac.exe deben estar bajo el mismo JDK; no mezclar JRE 24 con JDK 21.
  $binFolder = Split-Path $candidate -Parent
  $compiler = Join-Path $binFolder 'javac.exe'
  $javaExe = Join-Path $binFolder 'java.exe'
  if(-not((Test-Path -LiteralPath $javaExe -PathType Leaf) -and
          (Test-Path -LiteralPath $compiler -PathType Leaf))){continue}
  try {
    $info = (& $javaExe --version 2>&1 | Out-String)
    if($LASTEXITCODE -ne 0){continue}
    $parsed = [regex]::Match($info, '(?im)(?:java|openjdk)\s+(?:version\s+)?"?([0-9]+)')
    if(-not $parsed.Success){continue}
    $major = [int]$parsed.Groups[1].Value
    if($major -lt 21){continue}
    $javacInfo = (& $compiler -version 2>&1 | Out-String)
    if($LASTEXITCODE -ne 0 -or $javacInfo -notmatch ('(?i)javac\s+'+$major+'(?:\.|\s|$)')){continue}
    $candidateJdk = @{Base=(Split-Path $binFolder -Parent);Version=$major}
    if($major -eq 21){$found=$candidateJdk;break}
    if($null -eq $found){$found=$candidateJdk}
  }catch{continue}
}
if($null -eq $found){
  $javaCommand=Get-Command java -ErrorAction SilentlyContinue
  $javaLocation=if($javaCommand){$javaCommand.Source}else{'No se encontró java.exe'}
  Write-Host ('Java activo: '+$javaLocation) -ForegroundColor Yellow
  Write-Host 'No se encontró un JDK completo: hacen falta java.exe y javac.exe de la misma versión.' -ForegroundColor Yellow
  Write-Host 'Instala JDK 21 con PowerShell (posiblemente requiera permisos de administrador):' -ForegroundColor Cyan
  Write-Host '  winget install --id EclipseAdoptium.Temurin.21.JDK --exact --source winget' -ForegroundColor Cyan
  Write-Host 'Luego abre otra terminal PowerShell, entra a Front-End y ejecuta ABRIR_MYACADEMY.bat.'
  throw 'Falta JDK 21+ completo con compilador javac.exe. Java Runtime (JRE) no es suficiente para Maven.'
}
$env:JAVA_HOME = $found.Base
$env:Path = (Join-Path $found.Base 'bin') + ';' + $env:Path
Write-Host ('JDK seleccionado solo para MyAcademy: '+$found.Version+' ('+$found.Base+')') -ForegroundColor Green
if($found.Version -ne 21){
  Write-Host ('Nota: JDK '+$found.Version+' puede ejecutar los proyectos Java 21; si la compilación falla, instala JDK 21.') -ForegroundColor Yellow
}
