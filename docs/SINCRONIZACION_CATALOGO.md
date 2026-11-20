# Proyección de desarrollo PostgreSQL → Elasticsearch

El backend actual tiene problemas de consistencia entre el Outbox, los eventos Kafka y la estructura de lectura de Elasticsearch. Hasta aprobar los parches por separado, `infra/SINCRONIZAR_INDICES.ps1` permite construir índices desde **las tablas PostgreSQL reales** (no inventa datos).

Sincroniza `course_categories`, `courses`, `course_schedules` y `course_locations` con sus UUID. No altera la base SQL. Es un mecanismo **temporal de desarrollo**, no reemplaza a Kafka, no elimina documentos obsoletos y debe retirarse al validar el indexador.

Ejecutar después de iniciar contenedores y Flyway:

```powershell
.\infra\SINCRONIZAR_INDICES.ps1
```

Para refrescar cada 15 segundos mientras pruebas cambios en el catálogo:

```powershell
.\infra\SINCRONIZAR_INDICES.ps1 -Continuo
```

Las consultas REST `GET /api/v1/course-categories/active` y `GET /api/v1/courses/published` usan Elasticsearch, por lo que este paso es útil cuando los comandos POST guardan datos pero el índice aún no se ha actualizado.

Nunca combines resultados de prueba con datos reales sin separarlos; no exponer Elasticsearch sin autenticación a Internet.
