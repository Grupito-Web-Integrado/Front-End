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
