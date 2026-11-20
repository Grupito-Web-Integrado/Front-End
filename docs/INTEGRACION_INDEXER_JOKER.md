# Integración de MyAcademy con el Indexer de Joker

## Separación de responsabilidades
- **Indexer de Joker** (`Grupito-Web-Integrado/Catalog-Indexer-`): componente Java de fondo que recibe eventos Kafka y escribe índices Elasticsearch. **NO es un controlador REST para buscar cursos desde Angular.**
- **Catálogo** (`Grupito-Web-Integrado/Catalogo-Cursos-Publico-1A`): ofrece las rutas `/api/v1/courses/published`, búsqueda, autocompletado y categorías. Consulta las proyecciones de Elasticsearch actualizadas por el Indexer.
- **MyAcademy Angular**: consulta solo Catálogo y muestra cursos publicados, categorías dinámicas y detalles del curso. Administradores pueden consultar desde `/gestion/integraciones` el estado de **Indexer de Joker**, Catálogo, Matrículas y Pagos.

## Integración sin tocar archivos de Joker
1. `infra/INICIAR_TODO.ps1 -Modo Api` inicia Docker, Kafka y abre la consola Maven del Indexer original (`INICIAR_SERVICIO.ps1 -Servicio indexer`).
2. El componente Indexer escucha los topics `catalog.COURSE.events`, `catalog.COURSE_CATEGORY.events`, `catalog.COURSE_SCHEDULE.events`, `catalog.COURSE_LOCATION.events`.
3. `proxy.conf.json` envía `/api/indexer/health` al Actuator `http://localhost:8084/actuator/health`. **Este endpoint solo diagnostica**, no modifica datos ni concede privilegios.
4. Las consultas del usuario final se mantienen en la API Catálogo, nunca se consulta directamente Elasticsearch desde el navegador.
5. `.github/workflows/joker-indexer-compat-ci.yml` clona el repositorio de Joker en una copia temporal, verifica topics y campos del documento de curso y **compila su código sin escribir en su repositorio**.

**Pendiente de validación integral:** publicar un curso vía Catálogo, comprobar la salida del Outbox/Kafka, esperar su indexación y recuperar el documento publicado desde Catálogo. La existencia de puertos, los health checks o compilar módulos no equivalen a esa prueba end-to-end.

## Autenticación real
Los botones "Estudiante" y "Administrador" inician sesión en el mismo realm Keycloak `myacademy`. Son rutas de entrada, **no asignan roles**. El backend debe revisar el JWT.

El primer arranque de Keycloak **no crea estudiantes ni administradores**. Puedes crearlos manualmente desde `http://localhost:8180/admin`, o ejecutar una sola vez en un entorno privado:
```powershell
.\infra\CREAR_CUENTAS_KEYCLOAK.ps1
.\infra\CREAR_CUENTAS_KEYCLOAK.ps1 -Confirmar
```
Este script crea dos usuarios con roles reales del realm y genera claves aleatorias, que solo aparecen en la consola. **No ejecutarlo en entornos compartidos o de producción**; los usuarios de desarrollo deben gestionarse por una política de identidad adecuada.
