# Entrega de MyAcademy Frontend · 20/11/2026

**Repositorio:** Grupito-Web-Integrado/Front-End
**Rama de integración:** feat/dwi-frontend-gonzalo
**Destino del PR:** feat/premium-frontend (borrador, revisión del equipo pendiente)

## Objetivo
Un frontend Angular unificado, responsive y **sin perfiles o datos ficticios en ejecución**, con dos vistas reales según Keycloak: estudiante y administrador. Los backends son repositorios separados y conservan la propiedad de sus respectivos integrantes.

## Casuística verificada o implementada

| Caso | Comportamiento | Verificación |
| --- | --- | --- |
| Navegación pública | Inicio, catálogo, detalle de un curso publicado | Compilación y smoke Angular |
| Categorías dinámicas | Consulta desde Catálogo, seis categorías iniciales y expansión | Tests de contratos HTTP y smoke |
| Búsqueda y filtros | Texto, categoría, modalidad, cupos, precio y ordenamiento | Filtra antes de paginar; código compilado |
| Paginación | Cambia de página sin perder filtros; límite explícito de 1 000 resultados públicos | Compilación y smoke |
| Sin cupos | No permite entrar al formulario de matrícula desde un curso agotado | Compilación y smoke |
| Cursos no publicados | No aparece la ficha pública de DRAFT/CANCELLED/COMPLETED | Control de estado en frontend |
| Login por rol | Ambos botones usan el realm Keycloak; el botón no concede permiso | Test de guardas y realm |
| Estudiante | Portal propio /mi-espacio, matrículas y estados desde su JWT | Tests unitarios de API y componente |
| Administrador | Panel /gestion, indicadores y accesos por módulo | Tests unitarios de componentes |
| Acceso denegado | Estudiante no puede abrir rutas de administrador | Test de guardas |
| Solicitud de matrícula | Validación de datos, sin doble POST, confirmación solo con respuesta del servidor | Compilación y smoke |
| Comprobante | Muestra referencia/estado que devuelve Matrículas; no almacena DNI en el historial | Inspección + smoke |
| Administración de cursos | Crear, editar datos, publicar, cancelar y completar | Contratos HTTP + compilación |
| Sedes y horarios | Asociados dentro de cada curso, no como perfiles mezclados | Contratos HTTP + compilación |
| Categorías admin | Carga varias páginas, incluyendo estados inactivos | Tests HTTP |
| Pagos | Visualización y actualización de registros de un microservicio | Tests HTTP; NO es pasarela real |
| Indexer de Joker | Se conserva intacto; Angular consulta Catálogo, y monitoriza health del Indexer | Contratos Kafka/Elasticsearch + CI |
| Respuesta de error | Vacíos reales, fallos HTTP y reintentos sin inventar resultados | Tests de componentes |
| Móvil | Menú administrativo accesible con botón táctil, ingreso visible y portales adaptables | Compilación; revisión manual pendiente |
| Arranque local | Frontend sin Docker o plataforma completa con Docker y Java | PowerShell CI + guía |

**Aclaración:** que un caso esté implementado y compile no demuestra que el servidor correspondiente esté disponible en tu PC; se debe comprobar manualmente allí.

## Qué ejecutar en Windows

Primero resguarda cualquier cambio local pendiente, y desde Front-End ejecuta:

\`\`\`powershell
git status
git fetch origin
git switch feat/dwi-frontend-gonzalo
git pull --ff-only
.\infra\DIAGNOSTICO_GENERAL.ps1
\`\`\`

### Ver solo la interfaz (sin Docker)

\`\`\`powershell
.\VER_FRONTEND.bat
\`\`\`

Se abre http://localhost:4200/inicio. Este modo usa el frontend real **sin cargar cursos falsos**. El login y los datos necesitan que los servicios estén encendidos; de lo contrario verás estados vacíos o mensajes de error.

### Levantar las APIs reales (Docker + JDK)

1. Abre Docker Desktop y confirma que \`docker info --format '{{.OSType}}'\` devuelve \`linux\`.
2. Comprueba JDK completo con \`javac -version\` (el script selecciona JDK 21 preferentemente).
3. Revisa el plan de integración sin tocar repositorios: \`.\infra\PREPARAR_BACKENDS.ps1\`.
4. Con los clones limpios y consentimiento del equipo, una sola vez: \`.\infra\PREPARAR_BACKENDS.ps1 -Confirmar\`.
5. Ejecuta \`.\ABRIR_MYACADEMY.bat\`, que intenta levantar Docker, Kafka, Catálogo, Matrículas, Pagos, Indexer y frontend.
6. Si no hay usuarios locales, crea los dos roles con \`.\infra\CREAR_CUENTAS_KEYCLOAK.ps1 -Confirmar\`; después visita http://localhost:4200/login.
7. Revisa \`.\infra\VERIFICAR.ps1\` y, con rol ADMIN, \`/gestion/integraciones\`.

**Nunca** subas \`infra/.env\`, claves o datos personales reales al repositorio. Los parches backend están separados; no se han fusionado a los repositorios de tus compañeros. No borres volúmenes Docker para reiniciar.

## Puertos

| Servicio | Puerto |
| --- | ---: |
| Angular | 4200 |
| Catálogo | 8080 |
| Pagos | 8081 |
| Matrículas | 8082 |
| Indexer de Joker | 8084 |
| Keycloak | 8180 |
| Elasticsearch | 9200 |

## Alcance todavía pendiente del backend

La plataforma es una **candidata de entrega académica del frontend**, no un producto certificado para uso comercial. La publicación de imágenes de curso, el cobro bancario real, las notificaciones y correo, la reserva atómica de cupos, la coordinación Saga/Outbox/Kafka de extremo a extremo y las autorizaciones backend de todos los repositorios requieren desarrollo y pruebas propias de cada microservicio.

El CI de navegador usa Keycloak real y servicios HTTP efímeros para aislar la autenticación; por ello, aun si pasa, no certifica el flujo bancario o la matrícula integral contra todos los backends.

## Para exponer
Explica primero el problema de consultar cursos y gestionar matrículas manualmente; después muestra el catálogo dinámico, la ficha pública, el acceso por roles, el portal del estudiante, el panel administrativo y la arquitectura API → Catálogo → Kafka/Indexer → Elasticsearch. Señala el papel de cada microservicio y distingue pruebas automatizadas de operaciones que requieren el entorno local.

## Corrección definitiva del formulario obligatorio de Keycloak

La prueba E2E de navegador reprodujo un caso real: después de escribir usuario y contraseña, Keycloak detenía el acceso en **Update Account Information** porque las cuentas se creaban sin `firstName` y `lastName`. El script `CREAR_CUENTAS_KEYCLOAK.ps1` ahora define ambos campos desde el alta. En un entorno previamente inicializado, sin cambiar contraseñas ni permisos, se puede reparar solo esas dos cuentas de prueba:

```powershell
.\infra\COMPLETAR_PERFILES_KEYCLOAK.ps1
.\infra\COMPLETAR_PERFILES_KEYCLOAK.ps1 -Confirmar
```

Esta corrección se aplica únicamente a `estudiante.myacademy` y `administrador.myacademy` cuando ya existen; no se sobrescribe ninguna otra cuenta ni el trabajo de otro integrante.
