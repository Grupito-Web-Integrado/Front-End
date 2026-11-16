param([string]$Elasticsearch='http://localhost:9200')
$ErrorActionPreference='Stop'
$carpeta=Join-Path $PSScriptRoot 'elastic-indices'
if(-not(Test-Path $carpeta)){throw "No se encuentra $carpeta"}
Write-Host "Esperando Elasticsearch en $Elasticsearch..."
$disponible=$false
for($n=0;$n -lt 45;$n++){
  try{
    $null=Invoke-WebRequest -Uri $Elasticsearch -UseBasicParsing -TimeoutSec 5
    $disponible=$true;break
  }catch{Start-Sleep -Seconds 3}
}
if(-not $disponible){throw "Elasticsearch no responde: $Elasticsearch. Revisa Docker Desktop."}
Get-ChildItem -Path $carpeta -Filter '*.json' | ForEach-Object {
  $nombre=$_.BaseName
  $url=$Elasticsearch.TrimEnd('/')+'/'+$nombre
  $existe=$false
  try {
    $respuesta=Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 8
    $existe=($respuesta.StatusCode -eq 200)
  }catch{
    $status=0
    if($_.Exception.Response){$status=[int]$_.Exception.Response.StatusCode}
    if($status -ne 404){throw "Error consultando índice $nombre: $($_.Exception.Message)"}
  }
  if($existe){Write-Host "Índice existente: $nombre";return}
  Write-Host "Creando índice: $nombre"
  $json=[IO.File]::ReadAllText($_.FullName)
  $null=Invoke-RestMethod -Uri $url -Method Put -Body $json -ContentType 'application/json' -TimeoutSec 30
}
Write-Host 'Indices Elasticsearch listos. Los contenidos se poblarán desde Kafka/indexer; no son datos reales por sí solos.' -ForegroundColor Green
