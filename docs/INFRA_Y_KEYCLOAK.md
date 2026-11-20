# Infraestructura local de MyAcademy y autenticación Keycloak

> Solo desarrollo universitario. No exponer esta configuración a Internet. No cargar datos personales reales.

## Arquitectura revisada

Frontend Angular: http://localhost:4200. Catálogo Spring WebFlux: http://localhost:8080. Pagos Spring MVC (H2 de memoria): http://localhost:8081. Matrículas Spring WebFlux: http://localhost:8082 (no ofrece API de matrícula todavía).

La infraestructura del repositorio de Catálogo utiliza PostgreSQL 5435, Redis 6379, Elasticsearch 9200 y opcional Jaeger/Kafka (3 brokers en `docker/kafka/docker-compose.yml`). La de Matrículas utiliza PostgreSQL 5436. Se integra Keycloak con su propia base PostgreSQL en http://localhost:8180.

## Pasos desde Windows (PowerShell)

1. Inicia Docker Desktop. Comprueba `docker info`.
2. Abre el repositorio frontend actualizado:
   ```powershell
   cd "C:\Users\gonza\Documents\Cursos 2022 UTP\CICLO X\Desarrollo Web Integrado\PROYECTO\Front-End"
   git fetch origin
   git switch feat/dwi-frontend-gonzalo
   git pull --ff-only
   ```
3. Para descargar los repositorios que falten y levantar toda la infraestructura de desarrollo, incluyendo Kafka de 3 brokers y Jaeger:
   ```powershell
   .\infra\INICIAR_INFRA.ps1 -PrepararRepos -ConKafka -ConObservabilidad
   ```
   El script genera `infra/.env` con contraseñas aleatorias si no existe; **no subirlo a GitHub**. No modifica repositorios existentes ni actualiza ramas de otras personas.
4. Abre http://localhost:8180/admin. La cuenta administrativa inicial tiene el usuario y contraseña indicados en `infra/.env` local. En el realm `myacademy`, crea usuarios de prueba y asigna roles **ADMIN** y/o **ESTUDIANTE** en Realm roles. No incluyas contraseñas de usuarios en commits.
5. Para ejecutar los microservicios Java desde sus repositorios (requiere **JDK 21**), abre tres o cuatro terminales:
   ```powershell
   .\infra\ABRIR_APIS.ps1 -IncluirIndexer
   ```
   Se abren consolas Maven independientes. Comprueba sus logs; si falla alguno, corrige el servicio correspondiente. Iniciar un script no demuestra que la API esté disponible.
6. En otra terminal con Node 22.23.5:
   ```powershell
   fnm env --shell powershell | Out-String | Invoke-Expression
   fnm use 22.23.5
   npm ci
   npm start
   ```
7. Abre http://localhost:4200/login para iniciar sesión con Keycloak. Para ver el catálogo usa http://localhost:4200/catalogo. En `/gestion/integraciones` cambia a **modo API**. El JWT se añade a las llamadas `/api/v1/**` y `/api/pagos/**` cuando el usuario inició sesión.

## Seguridad

- El frontend utiliza Authorization Code con PKCE S256. Los tokens se mantienen en memoria.
- `public/auth-config.json` define URL del Keycloak local, realm y cliente SPA público; no almacena secretos.
- Los guards Angular son controles de experiencia de usuario, no autorización de servidor. El backend de Catálogo en main permite todo (permitAll); debe activarse seguridad JWT del lado backend para proteger escrituras. El servicio de Pagos tampoco valida JWT actualmente.
- `start-dev` de Keycloak, Elasticsearch sin autenticación y bases expuestas en 127.0.0.1 son **exclusivos para desarrollo local**.
- No usar el modo API con información real de estudiantes mientras Matrículas carezca de endpoints y controles de acceso.
- Correo y mensajería siguen a cargo del otro integrante del equipo.
- Antes de producción se necesita HTTPS, secretos gestionados, JWT en los servicios, backups, CORS limitado, CSRF según arquitectura y pruebas E2E.

## Puertos y solución de conflictos

| Servicio | Puerto local |
|---|---:|
| Angular | 4200 |
| Catálogo API | 8080 |
| Pagos API | 8081 |
| Matrícula Spring (sin endpoints de matrícula aún) | 8082 |
| Indexer | 8084 |
| Keycloak | 8180 |
| PostgreSQL catálogo | 5435 |
| PostgreSQL matrícula | 5436 |
| Redis | 6379 |
| Elasticsearch | 9200 |
| Kafka brokers | 9092, 9093, 9094 |
| Kafka UI | 8090 |
| Jaeger | 16686 |

Si los puertos 5435/5436/6379/9200 ya están ocupados por los Docker Compose de tus compañeros, detén solo los contenedores duplicados o cambia los puertos del compose de MyAcademy; **no borres volúmenes**. El frontend utiliza `proxy.conf.json` para enviar /api/v1 a localhost:8080 y /api/pagos a localhost:8081.

## Limitaciones observadas

1. Matrículas no tiene controlador REST: no es posible crear una matrícula real desde la SPA hasta agregarlo en el backend.
2. El Indexer contiene configuración básica y debe comprobarse con Kafka y Elasticsearch funcionando. No sustituye el endpoint de búsqueda existente del Catálogo.
3. Pagos usa H2 en memoria: reiniciar el servicio elimina sus registros.
4. El equipo debe revisar compatibilidad JDK 21, migraciones Flyway, dependencias Maven y el orden de arranque real antes de la integración total.

### Backend autenticado (adaptaciones opt-in)
Una vez verificados los repositorios Java, aplica **explícitamente** `infra/APLICAR_SEGURIDAD_BACKENDS.ps1 -Catalogo -Pagos` si el equipo lo autoriza. El script crea respaldo y no trabaja sobre repositorios con cambios pendientes. Consulta `docs/SEGURIDAD_BACKEND.md`.

## Inicio único y apagado seguro

Para arrancar los contenedores del entorno, abrir las consolas Maven y ejecutar Angular con Node administrado por fnm, desde `Front-End`:

```powershell
.\infra\INICIAR_TODO.ps1
```

Si tu equipo no puede arrancar simultáneamente Kafka de tres brokers y Jaeger, prueba `./infra/INICIAR_TODO.ps1 -Ligero` (las APIs que dependen de Kafka podrían fallar). No es un comando de despliegue en producción.

Para detener **solo la infraestructura Docker** y conservar sus volúmenes:

```powershell
.\infra\DETENER_INFRA.ps1
```

Cierra las consolas Java y Angular con Ctrl+C. La infraestructura Keycloak/DB se arrancó y comprobó en un runner temporal de GitHub Actions, no en tu Windows.
