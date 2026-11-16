$checks = @(
  @{ Nombre='Keycloak'; Url='http://localhost:8180/realms/myacademy/.well-known/openid-configuration' },
  @{ Nombre='Elasticsearch'; Url='http://localhost:9200' },
  @{ Nombre='Catalogo'; Url='http://localhost:8080/actuator/health' },
  @{ Nombre='Pagos'; Url='http://localhost:8081/api/pagos' },
  @{ Nombre='Matriculas'; Url='http://localhost:8082/actuator/health' }
)
foreach($test in $checks){
  try{
    $response=Invoke-WebRequest -Uri $test.Url -UseBasicParsing -TimeoutSec 8
    Write-Host "$($test.Nombre): HTTP $($response.StatusCode)" -ForegroundColor Green
  }catch{Write-Host "$($test.Nombre): sin respuesta. $($_.Exception.Message)" -ForegroundColor Yellow}
}
Write-Host 'La verificación HTTP no reemplaza las pruebas de integración.'
