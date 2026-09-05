Frontend premium UI

Este frontend implementa las vistas solicitadas: login, catálogo, matrícula y confirmación con estilo premium.

Ejecutar localmente:

```bash
cd c:\Users\david\frontend-plataforma-cursos
npm install
npm start
```

Rama sugerida para subir los cambios:

```bash
git checkout -b feat/premium-frontend
git add .
git commit -m "Add premium frontend: login, catalogo, matricula, confirmacion"
git push -u origin feat/premium-frontend
```

Notas:
- El login local es un placeholder que guarda el usuario en `localStorage`. En producción reemplazar por Keycloak (ya preparado en `src/app/core/keycloak.config.ts`).
- La matrícula se guarda temporalmente en `localStorage` y la confirmación permite descargar un comprobante JSON. Reemplazar con llamadas al backend cuando esté disponible.

AVISO IMPORTANTE (PRUEBA - VERSIÓN INICIAL):
Esta rama y los cambios incluidos son una prueba del frontend y constituyen la versión inicial del mismo. Se encuentran sujetos a cambios, revisiones y mejoras posteriores. No deben considerarse definitivos ni en producción hasta que se realicen las integraciones y revisiones correspondientes.

