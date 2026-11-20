# Integración de JWT Keycloak en los servicios Java

**Estado:** adaptaciones propuestas para revisión; los repositorios externos no se han modificado automáticamente porque la instalación de GitHub Connector solo autoriza escribir en `Front-End`.

## Catálogo Spring WebFlux

La dependencia OAuth2 Resource Server ya existe en `pom.xml`. Copiar `integrations/backend-security/catalogo/SecurityConfig.java` sobre el original y el archivo `application-keycloak.yaml` a `src/main/resources`.

Con perfil `keycloak` activo, el catálogo mantiene lecturas públicas y exige JWT con realm role `ADMIN` para POST, PATCH, PUT y DELETE. Sin perfil, las escrituras se deniegan (no hay `permitAll` para modificar el catálogo).

## Pagos Spring MVC

Copiar `integrations/backend-security/pagos/SecurityConfig.java` y `application-keycloak.properties`. Agregar las dependencias `spring-boot-starter-security` y `spring-boot-starter-oauth2-resource-server` a `pom.xml`; retirar `@CrossOrigin(origins="*")` de `PagoController`. Todos los endpoints de pago requieren `ADMIN`.

El servicio continúa usando H2 en memoria y no constituye un sistema real de cobro. No exponer webhooks sin validar su firma del proveedor.

## Aplicación segura y controlada en tu computadora

Ejecutar después de `infra/INICIAR_INFRA.ps1 -PrepararRepos -ConKafka`:

```powershell
.\infra\APLICAR_SEGURIDAD_BACKENDS.ps1 -Catalogo -Pagos
```

Este script se niega a trabajar sobre repositorios con cambios sin guardar y conserva respaldos de los archivos que sustituye. Revisa `git diff` y crea ramas/PR independientes para cada microservicio.

Después inicia Catálogo y Pagos con `infra/INICIAR_SERVICIO.ps1 -Servicio catalogo` y `-Servicio pagos`, con perfil `keycloak`, puerto 8180 para Keycloak e issuer `http://localhost:8180/realms/myacademy`.

## Pendientes antes de producción

- Aprobación del equipo y pruebas de integración/autorización para ADMIN y ESTUDIANTE.
- Proteger endpoints que devuelvan borradores o información sensible en GET.
- Validar audiencia (`aud`) en los servicios, no solo issuer y firma.
- Roles por recurso, manejo de scopes, validaciones de negocio y logging.
- Configuración HTTPS, CORS, secretos y políticas de acceso reales.

El permiso de escritura de ChatGPT debe ampliarse a los repositorios `Catalogo-Cursos-Publico-1A` y `Estados_de_Pago` para subir estas adaptaciones a ramas y PR separados.
