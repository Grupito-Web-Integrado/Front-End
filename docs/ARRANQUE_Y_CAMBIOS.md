# MyAcademy — Guía para levantarlo y entender los cambios

Fecha: 16 de noviembre de 2026. Proyecto UTP: Desarrollo Web Integrado.
Rama de trabajo: feat/dwi-frontend-gonzalo. Base del equipo: feat/premium-frontend.
El Pull Request de integración todavía no está fusionado.

## Paso 1: traer la versión actual de GitHub

En PowerShell, dentro de la carpeta Front-End:

    git status
    git fetch origin
    git switch feat/dwi-frontend-gonzalo
    git pull --ff-only

Si la rama no existe localmente:

    git switch --track origin/feat/dwi-frontend-gonzalo

Si git status muestra modificaciones personales, crea un commit o respaldo ANTES de cambiar de rama. No ejecutes git reset --hard para resolver conflictos.

## Paso 2: VER LA PÁGINA (recomendado)

Doble clic en ABRIR_MYACADEMY.bat o ejecuta:

    .\infra\INICIAR_TODO.ps1 -Modo Demo

Utiliza fnm con Node 22.23.5 únicamente en la terminal de Angular, sin cambiar la versión global para otros proyectos. Si faltan dependencias npm, el script realiza npm ci; las instalaciones posteriores se saltan si package-lock.json no cambió.

Se abre: http://localhost:4200/inicio?modo=demo

Pantallas principales:
- /catalogo — buscador de 35 cursos de ejemplo, filtros y categorías dinámicas: seis inicialmente y opción para ver el resto.
- /curso/:id — ficha pública de curso PUBLISHED con información, imagen ilustrativa, horarios y sedes.
- /login — cambiar perfil demo estudiante/administrador (no autenticación real).
- /gestion/cursos — catálogo administrativo (perfil administrador demo).
- /gestion/cursos/:id — editar curso, horarios, sedes y estado de publicación desde una sola vista.
- /gestion/categorias — administrar categorías de ejemplo.
- /mis-matriculas — registros de prueba del navegador.
- /gestion/integraciones — modo demostración/API y comprobación de servicios.

Datos de ejemplo no son operaciones bancarias ni reservas reales. No introducir datos personales reales.

## Paso 3: levantar infraestructura y servicios API (opcional)

Antes de comenzar: Docker Desktop abierto, Java JDK 21, Git, Node 22.23.5 y espacio/memoria para Kafka, Elasticsearch, Keycloak y PostgreSQL. No eliminar bases o repositorios existentes de compañeros.

Los microservicios originales aún NO tienen todos los adaptadores del frontend. Para probar los parches de forma aislada:
1. Consultar el plan (no cambia archivos):

    .\infra\PREPARAR_BACKENDS.ps1

2. Si los clones están limpios y el equipo permite utilizar las adaptaciones, preparar ramas de integración LOCALES y respaldos:

    .\infra\PREPARAR_BACKENDS.ps1 -Confirmar

El script prepara tres ramas locales con nombre feat/myacademy-integracion-local (Catálogo, Matrículas y Pagos), sin push ni merge. Si encuentra modificaciones locales, se detiene. No vuelve a aplicar el parche por encima de uno existente.

3. Arrancar infraestructura + Kafka + consolas Java + Angular:

    .\infra\INICIAR_TODO.ps1 -Modo Api

O doble clic en LEVANTAR_MYACADEMY_API.bat.

4. Comprobar estados:

    .\infra\VERIFICAR.ps1

Entrar: http://localhost:4200/inicio?modo=api
Keycloak: http://localhost:8180/admin

Keycloak crea su contraseña de administrador en infra/.env al primer arranque. No compartir este archivo ni subirlo a GitHub. Debes crear usuarios de prueba y asignar roles del realm; los perfiles de demostración no son credenciales reales.

Los scripts levantan procesos en nuevas terminales, pero su apertura no garantiza que todos estén sanos: revisa sus logs, el comando VERIFICAR y las peticiones del frontend.

## Paso 4: cargar 35 cursos FICTICIOS en PostgreSQL (opcional)

Solo en entorno local de prueba no compartido, después de aplicar migraciones:

    .\infra\CARGAR_CURSOS_DEMO_EN_BD.ps1 -Confirmar

El script inserta categorías, cursos, horarios y sedes de ejemplo en PostgreSQL y actualiza los índices de Elasticsearch. No borra datos previos y utiliza INSERT ON CONFLICT. Esta sincronización es provisional hasta validar Kafka/Indexer. No ejecutar en producción.

## Detener sin borrar información

Detener Angular y los Java desde sus terminales: Ctrl+C.
Para detener contenedores pero conservar las bases de datos:

    .\infra\DETENER_INFRA.ps1

NO usar docker compose down -v, docker volume prune o git reset --hard sobre repositorios compartidos.

## Cambios de nuestra rama (respecto a feat/premium-frontend)

- Renovación responsive de MyAcademy con tipografía, portada y tarjetas de cursos.
- 35 cursos y 11 categorías de demostración; solo seis categorías visibles inicialmente, ajustándose a los datos y con expansión.
- Buscador con categorías y consultas HTTP a Catálogo; DTOs tipados y proxy /api/v1.
- Vista estudiante separada de la administración.
- Editor por curso con horarios, sedes, transiciones DRAFT/PUBLISHED/CANCELLED/COMPLETED.
- Portadas SVG propias por área. El backend original aún no permite guardar imagen permanente por curso.
- Roles de navegación de demostración y Keycloak OIDC+PKCE para modo API.
- Servicios HTTP de Pagos y adaptador REST experimental de Matrículas; no existe cobro real, reserva atómica ni Saga completa.
- Docker Compose local: PostgreSQL, Redis, Elasticsearch, Keycloak, Kafka externo del repositorio de Catálogo.
- Pruebas de Angular, Keycloak, compilación de adaptadores y proyección PostgreSQL -> Elasticsearch en GitHub Actions.
- Scripts de arranque, detención, carga opcional de datos de prueba y adaptaciones locales versionadas.

## Cambios de otros integrantes encontrados en GitHub

- David-exxe: creó el frontend original y registró una corrección SSR/localStorage en feature/correccion-ssr el 11 de octubre (hora de Perú). Esa corrección está en una rama distinta, no en la base premium.
- JoKeR1223335F: realizó cambios en Catalog-Indexer- el 12 de noviembre. Incluyen mapeo de índices, consumidores, documentos de cursos y eventos Kafka. Están en el repositorio del Indexer, no automáticamente en la rama Angular.
- jhondeivid22: modificó estilos y botones del servicio Estados_de_Pago el 11 de octubre (hora de Perú). El CSS de ese backend no modifica directamente el diseño Angular.
- En los repositorios originales Catálogo y Matrículas no se localizaron commits posteriores a agosto y septiembre, respectivamente, durante la revisión del historial.

El autor de los commits de nuestra rama figura como LYRELAK; no son commits de los otros colaboradores. Los parches para backend están conservados en Front-End/integrations y requieren revisión antes de integrarse en los repositorios originales.

## Lo pendiente para decir que está listo para producción

- Pruebas E2E completas del flujo API -> Outbox -> Kafka -> Indexer -> Elasticsearch.
- Incorporar autorizaciones, parches y migraciones a las ramas oficiales de los backends.
- Matrículas: completar gestión de cupos, Saga, pagos y confirmaciones.
- Correos y notificaciones todavía no integrados de extremo a extremo.
- Persistencia de imágenes del curso en el backend, seguridad HTTPS y control de datos.
- Validación integral en tu Windows; las pruebas de GitHub Actions no sustituyen el arranque de tu equipo.

El proyecto está listo para VALIDACIÓN VISUAL LOCAL; el modo API es una integración experimental. No está desplegado como web pública.
