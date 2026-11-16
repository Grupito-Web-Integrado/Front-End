# MyAcademy: mapa de integración y pendientes (noviembre 2026)

## Repositorios revisados

- Frontend: `Grupito-Web-Integrado/Front-End` (Angular 22).
- Cursos: `Grupito-Web-Integrado/Catalogo-Cursos-Publico-1A` (Spring WebFlux, PostgreSQL, Flyway, Elasticsearch, Redis y eventos).
- Indexador: `Grupito-Web-Integrado/Catalog-Indexer-` (Kafka → Elasticsearch; no se encontró controlador REST para consumo directo desde Angular).
- Matrículas: `Grupito-Web-Integrado/Matricula-Publico_1E` (dominio Java con modelos, eventos y migraciones SQL; no se encontró controlador REST).
- Pagos: `Grupito-Web-Integrado/Estados_de_Pago` (Spring Boot, REST en `/api/pagos`, base de datos H2 en memoria).

Este documento refleja los controladores y migraciones revisados; no equivale a una prueba de todos los servicios ejecutándose.

## Contratos de consultas del catálogo

Los endpoints reales utilizan el prefijo `/api/v1`. Las búsquedas paginadas devuelven `PageResult<T>` con `content`, `totalElements`, `totalPages`, `page` y `size`.

| Método | Endpoint | Uso en frontend |
|---|---|---|
| GET | `/courses/published?page&size` | Tarjetas públicas |
| GET | `/courses?text&page&size` | Buscador de texto |
| GET | `/courses/autocomplete?text&limit` | Sugerencias |
| GET | `/courses/category/{categoryId}?page&size` | Categoría dinámica |
| GET | `/courses/search-criteria?page&size&name&code&modality&status` | Gestión / filtros |
| GET | `/courses/{id}` | Detalle |
| GET | `/courses/count` | Diagnóstico |
| GET | `/course-categories/active?page&size` | Menú de categorías |
| GET | `/course-categories/all?page&size` | Administración |
| GET | `/course-schedules/course/{courseId}?page&size` | Horarios |
| GET | `/course-locations/course/{courseId}?page&size` | Sedes |

## Contratos de escritura del catálogo

| Método | Endpoint | Uso |
|---|---|---|
| POST | `/courses` | Crear curso: code, name, description, modality, price, currency, startDate, endDate, startTime, durationHours, capacity, categoryId, status |
| PATCH | `/courses/{id}/publish`, `/cancel`, `/complete` | Cambiar ciclo de vida |
| PATCH | `/courses/{id}/name`, `/price`, `/description` | Editar datos en peticiones separadas |
| POST | `/course-categories` | Crear categoría |
| PATCH | `/course-categories/{id}/activate`, `/deactivate`, `/name`, `/description` | Administrar categorías |
| POST | `/course-schedules` | Crear horario |
| PATCH | `/course-schedules/{id}/day`, `/start-time`, `/end-time`, `/room` | Editar horario |
| POST | `/course-locations` | Crear sede |
| PATCH | `/course-locations/{id}/name`, `/address`, `/city`, `/reference`, `/capacity` | Editar sede |

Al modificar varios campos de una entidad, el frontend envía PATCH secuenciales para evitar operaciones concurrentes sobre la misma versión del agregado.

## Contratos del servicio de pagos

- `GET /api/pagos`: listar.
- `GET /api/pagos/{id}`: detalle.
- `POST /api/pagos?monto=...`: crear registro EN_PROCESO.
- `PATCH /api/pagos/{id}/estado?estado=...`: actualizar estado.
- `POST /api/pagos/{id}/confirmar`: pasar a PAGADO.
- `POST /api/pagos/{id}/cancelar`: pasar a CANCELADO.
- Webhook Mercado Pago: endpoint reservado para el servidor; **no debe simularse desde el navegador público**.

El servicio revisado mantiene pagos en H2 en memoria y no demuestra un cobro bancario real. Mostrar “PAGADO” es un estado del registro, no evidencia de una transacción bancaria.

## Lo que sigue sin tener contrato confirmado

1. **Matrículas reales:** falta API REST para crear, consultar y cancelar matrículas del microservicio. Por ello el frontend guarda las matrículas demo en `localStorage`. No se reserva un cupo real.
2. **Login y autorización:** existen archivos de ejemplo de Keycloak pero no se dispone de URL de servidor, realm, cliente y roles verificados. El formulario de acceso falso se reemplazó por información clara de modo demo.
3. **Correo y mensajería:** los gestionará otro integrante. Todavía falta contrato de notificaciones y pruebas E2E.
4. **Infraestructura:** los puertos 8080/8081 del proxy son configurables y deben confirmarse en cada servicio. Se deben probar PostgreSQL, Kafka, Redis y Elasticsearch en el entorno real.
5. **Seguridad:** el controlador de seguridad examinado del catálogo permite todas las peticiones (`permitAll`). Es imprescindible configurar autorización de servidor antes de un lanzamiento público.
6. **Calidad y despliegue:** falta prueba E2E con microservicios levantados, revisión de accesibilidad y de dependencias (`npm audit` advirtió vulnerabilidades), y configuración de hosting/HTTPS.

## Criterio de aceptación

- `npm ci`, `npm run test:smoke` y `npm run build` pasan en CI.
- Modo DEMO se distingue visualmente de modo API.
- Catálogo, buscador, detalle, categorías, horarios, sedes, matrículas y pagos muestran estados vacíos/errores comprensibles.
- El backend de catálogo y pagos responde en modo API sin datos falsos de respaldo.
- Los módulos sin API se etiquetan como demostración; nunca se les atribuye persistencia en servidor.

Para usar esta información como contexto de IA se puede indexar esta documentación junto con las migraciones, controladores y README de los repositorios. Esto **no entrena un nuevo modelo** ni confiere permisos por sí mismo.
