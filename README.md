> **Vista inmediata:** abre `ABRIR_MYACADEMY.bat` con doble clic desde la carpeta `Front-End`; utiliza Node 22.23.5 y abre el catálogo en `http://localhost:4200/inicio` en **modo demostración**, sin Docker. En `/login` cambia entre perfil estudiante y administrador de prueba. 
>
> **Modo conectado:** los servicios requieren Docker y los parches Java locales versionados en `integrations/`, revisados por los responsables de cada microservicio. La carga opcional de **35 cursos ficticios** en PostgreSQL se hace con `infra/CARGAR_CURSOS_DEMO_EN_BD.ps1 -Confirmar` y después con Elasticsearch. Los pagos no cobran realmente y la matrícula tiene un adaptador experimental.
>
> Guías: `docs/COMO_VER_RESULTADO.md`, `docs/MATRICULA_REST_TEMPORAL.md`, `docs/OUTBOX_CATALOGO.md` y `docs/SEED_DEMO_API.md`.

# MyAcademy · Desarrollo Web Integrado

Frontend Angular de la plataforma académica. Código de trabajo en `feat/dwi-frontend-gonzalo`, derivado de `feat/premium-frontend`.

## Iniciar en Windows

Necesitas Node.js 22.22.3+ (por ejemplo con fnm). Mantén tu Node 20 disponible para otros proyectos.

```powershell
cd "C:\Users\gonza\Documents\Cursos 2022 UTP\CICLO X\Desarrollo Web Integrado\PROYECTO\Front-End"
fnm env --shell powershell | Out-String | Invoke-Expression
fnm use 22.23.5
npm ci
npm start
```

Ir a http://localhost:4200/inicio. El catálogo demo funciona sin backend. Revisa `npm run build` antes de integrar la rama.

## Modo demo / API

La ruta `/gestion/integraciones` permite cambiar manualmente entre datos simulados y peticiones reales. **Nunca se reemplazan automáticamente errores del backend con registros falsos.**

- Catálogo: `/api/v1` → `http://127.0.0.1:8080`
- Pagos: `/api/pagos` → `http://127.0.0.1:8081`
- Ajusta puertos en `proxy.conf.json` si tus microservicios utilizan otros.
- Matrículas: demo persistida en navegador; el repositorio `Matricula-Publico_1E` revisado todavía no expone REST.
- El modo demo usa perfiles visuales sin permisos reales. En modo API se integra Keycloak con OpenID Connect, pero los microservicios originales aún requieren revisar y aplicar sus propios controles JWT antes de cualquier despliegue público.

## Rutas

`/inicio`, `/catalogo`, `/curso/:id`, `/matricula/:idCurso`, `/mis-matriculas`, `/pagos`, `/gestion/cursos`, `/gestion/categorias`, `/gestion/horarios`, `/gestion/sedes`, `/gestion/estudiantes`, `/gestion/integraciones`.

## Seguridad y límites

Los nombres, precios y cursos demo son ficticios. Las solicitudes de pago del servicio Java registran estados, pero **no realizan cobros bancarios**. No almacenar información real de estudiantes en el modo demo (usa localStorage). Antes de desplegar: pruebas end-to-end, control de acceso, privacidad, manejo de errores, validación de CORS/puertos y revisión de los microservicios.

La rama del equipo `feat/premium-frontend` no se modifica directamente. Integrar mediante Pull Request.

## Avance: curso como unidad funcional

La estructura de la plataforma separa las pantallas por rol:

- **Vista estudiante:** `/curso/:id`. Solo se muestran cursos `PUBLISHED`. Incluye portada, descripción, modalidad, cupos, fechas, horarios y sedes del backend.
- **Vista administrador:** `/gestion/cursos/:id`. Edición de datos, publicación/cancelación/finalización, y gestión de horarios y sedes **asociados al curso**.
- **Categorías:** las once categorías de demostración pueden crearse/editarse; el encabezado público enseña **como máximo seis** inicialmente y permite desplegar las demás. En modo API se recuperan todas las páginas de `/api/v1/course-categories/active`.
- **Imágenes:** SVGs propios bajo `public/course-covers` y campo `imageUrl` exclusivo de demostración. El DTO Java no incorpora imagen; hace falta ampliar el backend para guardar una portada real.

`CourseStatus` contiene `DRAFT`, `PUBLISHED`, `CANCELLED` y `COMPLETED`. Modalidad presencial se serializa como `IN_PERSON`.

### Probar ambos perfiles en modo demostración

1. Abre `http://localhost:4200/login`.
2. Selecciona **Vista estudiante** para el catálogo y matrículas de prueba.
3. Selecciona **Vista administrador** para habilitar el menú de gestión y editar `/gestion/cursos`.
4. Ninguno de estos perfiles ficticios otorga derechos reales en los microservicios.

### Poner en marcha la infraestructura

```powershell
.\infra\INICIAR_TODO.ps1
```

Este comando necesita Docker Desktop, Git, Java 21, fnm/Node.js 22.23.5 y puertos libres. Consulta `docs/INFRA_Y_KEYCLOAK.md`. Los scripts inicializan índices de Elasticsearch que Catálogo necesita para devolver datos en lugar de error 500 por índice inexistente. No reinicies ni elimines los volúmenes de tus compañeros.

Para ver el estado del backend:

```powershell
.\infra\VERIFICAR.ps1
```

En el navegador, entra en `/gestion/integraciones` y selecciona modo API una vez que los servidores respondan. El endpoint real de Matrículas todavía no existe; las matrículas demo se conservan únicamente en el navegador.

### Pruebas automáticas

- `npm run test:smoke`
- `npx ng test --watch=false --include=src/app/core/academia-api.service.spec.ts`
- `npm run build`
- GitHub Actions: `angular-ci.yml`, `catalog-integration-ci.yml`, `keycloak-smoke-ci.yml`.

**No fusionar a producción** sin revisar seguridad backend, migraciones, indexador Kafka y pruebas E2E.
