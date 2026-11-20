# Elasticsearch: índices y proyecciones faltantes

La prueba del 16 de noviembre de 2026 arrancó PostgreSQL, Redis, Elasticsearch, Catálogo Java y Pagos Java. Los migrations Flyway pasaron, pero la consulta `GET /api/v1/course-categories/active?page=0&size=10` devolvió **500** por:

```text
ElasticsearchException: [es/search] failed:
[index_not_found_exception] no such index [course_categories]
```

El repositorio `Catalog-Indexer-` incluye inicializadores para `courses` y `course_locations`, pero no se localizaron inicializadores equivalentes para `course_categories` y `course_schedules`. El repositorio Catálogo consulta los cuatro índices en Elasticsearch.

**Mitigación de desarrollo:** `infra/INICIALIZAR_INDICES.ps1` crea de forma idempotente los cuatro índices con mapeos basados en los adaptadores de lectura Java. No borra índices existentes ni carga datos ficticios.

**Limitación:** crear índices vacíos permite que los GET no fallen por índice ausente, pero las categorías y los cursos reales solo aparecen cuando el indexador procesa eventos Kafka desde la base de datos. Debe verificarse el flujo completo Outbox → Kafka → Indexer → Elasticsearch y las proyecciones coherentes con PostgreSQL. Los índices y esquemas definitivos deben revisarse con el responsable del backend.

En Windows se puede ejecutar:

```powershell
.\infra\INICIALIZAR_INDICES.ps1
```

Después repetir `infra\VERIFICAR.ps1` y las consultas GET de cursos y categorías.

La CI `.github/workflows/catalog-integration-ci.yml` prueba el arranque con bases/Elasticsearch reales y consulta los endpoints. Esto no sustituye el test de publicación real de un curso, cuyo indexado requiere Kafka e indexador.
