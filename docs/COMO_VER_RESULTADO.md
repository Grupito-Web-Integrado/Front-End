# Inicio de MyAcademy sin modo de demostración

1. `git switch feat/dwi-frontend-gonzalo` y `git pull --ff-only` en el repositorio local.
2. Con Docker Desktop, JDK 21 y Node 22 disponibles, revisa `infra/PREPARAR_BACKENDS.ps1`; ejecútalo con `-Confirmar` únicamente cuando los clones de microservicios estén limpios y el equipo haya aprobado las adaptaciones locales.
3. Haz doble clic en `ABRIR_MYACADEMY.bat`. Ahora inicia la infraestructura y el frontend conectados, **no hay vista DEMO**.
4. Configura en Keycloak usuarios reales con roles `ESTUDIANTE` y `ADMIN`. En un entorno nuevo, usa `infra/CREAR_CUENTAS_KEYCLOAK.ps1 -Confirmar` para crearlos con contraseñas aleatorias.
5. Abre http://localhost:4200/login, elige la entrada de estudiante o administrador y autentícate en Keycloak.
6. Comprueba `infra/VERIFICAR.ps1` y el panel /gestion/integraciones como administrador. Allí se comprueban Catálogo, Indexer de Joker, Matrículas y Pagos.
7. Si la BD no contiene cursos publicados, el catálogo aparece vacío. No se inyectan cursos falsos automáticamente. Crea y publica cursos mediante la vista ADMIN; para probar respuestas desde una base ficticia separada hay una carga SQL opcional documentada en `docs/SEED_DEMO_API.md`.

## Incidencia anterior
La captura mostraba `Timeout when waiting for 3rd party check iframe message`. Quitamos el check silencioso por iframe de `keycloak-js` y dejamos el inicio explícito con PKCE S256. Sin Keycloak encendido y con un rol real asignado, la aplicación no permite simular una cuenta.

## Integración Joker
Los cuatro consumers Kafka de su repositorio siguen bajo su control. MyAcademy verifica su health y obtiene resultados de búsqueda a través del servicio Catálogo. Ver `docs/INTEGRACION_INDEXER_JOKER.md`. Ningún archivo de Joker se ha sobrescrito.

**Esto todavía es validación local de un proyecto académico, no una certificación de producción.**

## Correccion Windows: Java 24 y Docker apagado

Si aparece `API requiere Java JDK 21. Detectado: java 24...`, ya no es necesario reinstalar Node ni Angular. La revision actual ejecuta `infra/SELECCIONAR_JAVA.ps1` al iniciar: busca JDK 21 (incluidos JDK de Eclipse Adoptium, Java, Microsoft, Corretto y Zulu) y lo prefiere; si solo hay JDK >= 21, acepta la version activa y advierte de posibles incompatibilidades de Maven. Los cambios en `JAVA_HOME` y `PATH` son solo para la terminal de ejecucion y sus procesos hijos; no afectan otros proyectos.

Si aparece `failed to connect to dockerDesktopLinuxEngine`, abre Docker Desktop e inicia el motor Linux. `infra/COMPROBAR_DOCKER.ps1` intenta abrir Docker Desktop cuando esta instalado y verifica que `docker info --format '{{.OSType}}'` sea `linux`. Si no responde, el script detiene el arranque ANTES de intentar crear usuarios en Keycloak. El sistema requiere Docker Desktop con backend WSL 2 en Windows.

Secuencia:
```powershell
git pull --ff-only
docker info --format '{{.OSType}}'
.\ABRIR_MYACADEMY.bat

# Solo cuando Keycloak responda en 8180:
.\infra\CREAR_CUENTAS_KEYCLOAK.ps1 -Confirmar
.\infra\VERIFICAR.ps1
```

## Corrección definitiva del formulario obligatorio de Keycloak

La prueba E2E de navegador reprodujo un caso real: después de escribir usuario y contraseña, Keycloak detenía el acceso en **Update Account Information** porque las cuentas se creaban sin `firstName` y `lastName`. El script `CREAR_CUENTAS_KEYCLOAK.ps1` ahora define ambos campos desde el alta. En un entorno previamente inicializado, sin cambiar contraseñas ni permisos, se puede reparar solo esas dos cuentas de prueba:

```powershell
.\infra\COMPLETAR_PERFILES_KEYCLOAK.ps1
.\infra\COMPLETAR_PERFILES_KEYCLOAK.ps1 -Confirmar
```

Esta corrección se aplica únicamente a `estudiante.myacademy` y `administrador.myacademy` cuando ya existen; no se sobrescribe ninguna otra cuenta ni el trabajo de otro integrante.
