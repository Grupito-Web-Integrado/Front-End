# Contratos reales del catálogo (controladores Java)

Los estados de `CourseStatus.java` son exactamente: **DRAFT**, **PUBLISHED**, **CANCELLED**, **COMPLETED**. No existen `IN_PROGRESS` ni `INACTIVE` en el modelo real del curso.

Modalidades en `CourseModality.java`: **ONLINE**, **IN_PERSON**, **HYBRID**.

Cada curso tiene un `categoryId` (relación única) en `CourseEntity`, pero el DTO completo incluye colecciones `categories`, `schedules` y `locations`. La respuesta `CourseSummaryDto` **no tiene descripción, categoría ni imagen**; por ello el frontend consulta el detalle para enriquecer los resultados que muestra.

`imageUrl` es metadato del frontend de demostración. No se envía en POST de creación ni PATCH al backend porque falta columna de imagen y endpoints de edición o carga. Se proporcionan ilustraciones SVG locales y se requiere un cambio de esquema/DTO/back-end para persistencia real.

La vista pública no permite editar, solo explorar cursos PUBLISHED. La vista administrativa tiene rutas protegidas y operaciones separadas POST/PATCH, con horarios y sedes integrados por curso.
