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
- El login original sigue siendo simulado: **no se debe utilizar como autenticación real**. Configurar Keycloak con realm/client válidos y controles por rol antes de publicar a Internet.

## Rutas

`/inicio`, `/catalogo`, `/curso/:id`, `/matricula/:idCurso`, `/mis-matriculas`, `/pagos`, `/gestion/cursos`, `/gestion/categorias`, `/gestion/horarios`, `/gestion/sedes`, `/gestion/estudiantes`, `/gestion/integraciones`.

## Seguridad y límites

Los nombres, precios y cursos demo son ficticios. Las solicitudes de pago del servicio Java registran estados, pero **no realizan cobros bancarios**. No almacenar información real de estudiantes en el modo demo (usa localStorage). Antes de desplegar: pruebas end-to-end, control de acceso, privacidad, manejo de errores, validación de CORS/puertos y revisión de los microservicios.

La rama del equipo `feat/premium-frontend` no se modifica directamente. Integrar mediante Pull Request.
