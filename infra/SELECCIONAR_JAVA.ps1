# Dot-source este archivo para preparar solo esta terminal y sus procesos hijos.
# Prefiere JDK 21. Si solo hay JDK >= 21 (por ejemplo Java 24), lo permite
# sin tocar JAVA_HOME ni el PATH global del usuario.
$javaCandidates = New-Object 'System.Collections.Generic.List[string]'
$homes = @($env:JDK21_HOME, $env:JAVA21_HOME, $env:JAVA_HOME)
foreach($home in $homes) {
  if(-not [string]::IsNullOrWhiteSpace($home)) {
    $javaCandidates.Add((Join-Path $home 'bin\java.exe'))
  }
}
$roots = @(
  (Join-Path $env:ProgramFiles 'Eclipse Adoptium'),
  (Join-Path $env:ProgramFiles 'Java'),
  (Join-Path $env:ProgramFiles 'Microsoft'),
  (Join-Path $env:ProgramFiles 'Amazon Corretto'),
  (Join-Path $env:ProgramFiles 'Zulu')
)
foreach($root in $roots) {
  if(Test-Path $root) {
    foreach($dir in @(Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue | Where-Object {$_.Name -match '21'})) {
      $javaCandidates.Add((Join-Path $dir.FullName 'bin\java.exe'))
    }
  }
}
$active = Get-Command java -ErrorAction SilentlyContinue
if($active -and $active.Source) {
  $javaCandidates.Add($active.Source)
}
$found = $null
foreach($exe in @($javaCandidates | Select-Object -Unique)) {
  if(-not(Test-Path -LiteralPath $exe)) {continue}
  $home = Split-Path (Split-Path $exe -Parent) -Parent
  $compiler = Join-Path $home 'bin\javac.exe'
  if(-not(Test-Path $compiler)) {continue}
  try {
    $out = (& $exe --version 2>&1 | Out-String)
    if($LASTEXITCODE -ne 0) {continue}
    if($out -notmatch '(?im)^(?:openjdk|java)\s+(?:version\s+)?"?([0-9]+)') {continue}
    $major = [int]$matches[1]
    if($major -lt 21) {continue}
    if($major -eq 21) {
      $found = @{Home=$home;Version=$major;Java=$exe}
      break
    }
    if(-not $found) { $found = @{Home=$home;Version=$major;Java=$exe} }
  } catch {
    continue
  }
}
if(-not $found) {
  throw 'No hay un JDK 21+ accesible. Instala JDK 21 (preferible) o configura JAVA_HOME apuntando a un JDK con javac.exe.'
}
$env:JAVA_HOME = $found.Home
$env:Path = (Join-Path $found.Home 'bin') + ';' + $env:Path
Write-Host ('JDK seleccionado para MyAcademy: '+$found.Version+' ('+$found.Home+')') -ForegroundColor Green
if($found.Version -ne 21) {
  Write-Host 'ADVERTENCIA: compilaremos con JDK '+$found.Version+' contra proyectos de Java 20/21. Si Maven falla, instala JDK 21 para esta terminal.' -ForegroundColor Yellow
}
