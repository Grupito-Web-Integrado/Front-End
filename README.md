# MyAcademy · Frontend Angular conectado a microservicios

Proyecto académico de Desarrollo Web Integrado (UTP). Código en rama `feat/dwi-frontend-gonzalo`, pendiente de revisión en Pull Request hacia `feat/premium-frontend`.

## Autenticación y perfiles

**Ya no hay selector DEMO ni permisos simulados.** Desde `/login` hay dos accesos: **Estudiante** y **Administrador**. Ambos redirigen al mismo Keycloak (realm `myacademy`, cliente `myacademy-web`). El rol real del JWT determina qué pantallas se habilitan. Elegir un botón **no crea ni otorga un rol**.

Se retiró la comprobación silenciosa por iframe que provocaba `Timeout when waiting for 3rd party check iframe message`. El adaptador inicia sin ese iframe y procesa el código OAuth cuando vuelve de Keycloak. Si Keycloak está apagado, la autenticación no puede completarse: no existe acceso alternativo ni perfiles falsos.

## Ejecutarlo en Windows

Requisitos: Docker Desktop, JDK 21, Git, Node 22.23.5 (fnm), memoria suficiente para Kafka, Elasticsearch y Keycloak. Trabaja en la carpeta `Front-End`:

```powershell
git fetch origin
git switch feat/dwi-frontend-gonzalo
git pull --ff-only

# Revisar primero: no modifica repositorios
.\infra\PREPARAR_BACKENDS.ps1

# Aplicar la integración en ramas LOCALES, sin sobrescribir ramas ajenas
.\infra\PREPARAR_BACKENDS.ps1 -Confirmar

# Arrancar infraestructura, backend y frontend
.\ABRIR_MYACADEMY.bat

# En otra terminal: crear cuentas con roles reales en Keycloak si aún no existen
.\infra\CREAR_CUENTAS_KEYCLOAK.ps1 -Confirmar

# Comprobar estado de todos los servicios
.\infra\VERIFICAR.ps1
```

`PREPARAR_BACKENDS.ps1` se detiene si hay cambios locales pendientes en Catálogo, Matrículas o Pagos, y crea ramas `feat/myacademy-integracion-local` para no alterar el trabajo del equipo. Los adaptadores son provisionales y requieren revisión independiente antes de integrarse en las ramas originales.

Al arrancar: http://localhost:4200/login. Keycloak: http://localhost:8180/admin. La inicialización de `infra/.env` genera contraseñas aleatorias; **no subas ese archivo a GitHub**. El script de cuentas genera claves que solo deben guardarse en un lugar privado; se utiliza una única vez por entorno.

### Rutas principales

| Perfil | Ruta | Operación |
| --- | --- | --- |
| Público | `/inicio`, `/catalogo`, `/curso/:id` | Cursos publicados, categorías, búsqueda, información y cupos reales |
| Estudiante (ESTUDIANTE) | `/mis-matriculas`, `/matricula/:idCurso` | Solicitudes y seguimiento de matrículas |
| Administrador (ADMIN) | `/gestion/cursos`, `/gestion/cursos/:id` | Gestión de cursos y relaciones |
| Administrador (ADMIN) | `/gestion/categorias`, `/gestion/estudiantes`, `/pagos` | Categorías, matrículas y registros del servicio de pagos |
| Administrador (ADMIN) | `/gestion/integraciones` | Diagnóstico de cuatro microservicios |

No hay datos ficticios de respaldo: si Catálogo no responde, se verá el error. Si el servidor no contiene cursos publicados, el catálogo estará vacío hasta crearlos y publicarlos.

## Conexión con el Indexer de Joker, sin alterar su código

- Repositorio original: https://github.com/Grupito-Web-Integrado/Catalog-Indexer-
- Se clona y ejecuta **sin modificaciones** desde su consola Maven propia en el puerto local 8084.
- Consume Kafka (`catalog.COURSE.events`, `catalog.COURSE_CATEGORY.events`, `catalog.COURSE_SCHEDULE.events`, `catalog.COURSE_LOCATION.events`) y actualiza Elasticsearch.
- Angular consulta la API de Catálogo en el puerto 8080; Catálogo utiliza Elasticsearch. No se inventa una API de búsqueda en el Indexer.
- `/api/indexer/health` se envía a `http://127.0.0.1:8084/actuator/health` para comprobar Kafka y Elasticsearch desde el panel administrativo. Los puertos 8081 y 8082 corresponden a Pagos y Matrículas.
- `proxy.conf.json` utiliza reglas Vite `/api/v1/**`, `/api/pagos/**`, `/api/matriculas/**` y `/api/indexer/**` para cubrir subrutas y peticiones de detalle.

El Indexer no expone una pantalla frontend ni una API REST de búsqueda: su responsabilidad es el flujo de eventos. Más información en `docs/INTEGRACION_INDEXER_JOKER.md`.

## Comprobación y límites

```powershell
npm run test:smoke
npx ng test --watch=false --include=src/app/core/academia-api.service.spec.ts
npm run build
.\infra\VERIFICAR.ps1
```

Las pruebas CI han compilado Angular y los adaptadores Java de Catálogo, Matrículas y Pagos, validado los roles de Keycloak e Indexer y proyectado filas de PostgreSQL a Elasticsearch. **Esto no sustituye una validación real de acceso por navegador y el flujo completo de matrícula-pago-Kafka en el PC del estudiante.**

Por completar en los microservicios antes de un despliegue público: integración de adaptadores en repositorios originales mediante PR, Saga de matrículas, pagos reales, correos/WhatsApp, reserva de cupos, imágenes persistentes en backend, configuración HTTPS, autorización de extremo a extremo y E2E completo. Los scripts usan infraestructura local de desarrollo, no son un despliegue de producción.

Para detener Docker conservando volúmenes: `./infra/DETENER_INFRA.ps1`. No ejecutes `docker compose down -v` en un entorno compartido.
