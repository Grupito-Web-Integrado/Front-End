import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Importante: el callback de Keycloak retorna a /mi-espacio o /gestion.
 * Las rutas privadas deben renderizarse en el navegador para procesar
 * el código OIDC + PKCE ANTES de ejecutar el guard de Angular.
 * El catálogo público conserva SSR.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'acceso-denegado', renderMode: RenderMode.Client },
  { path: 'mi-espacio', renderMode: RenderMode.Client },
  { path: 'mis-matriculas', renderMode: RenderMode.Client },
  { path: 'matricula/:idCurso', renderMode: RenderMode.Client },
  { path: 'confirmacion', renderMode: RenderMode.Client },
  { path: 'gestion', renderMode: RenderMode.Client },
  { path: 'gestion/cursos', renderMode: RenderMode.Client },
  { path: 'gestion/cursos/:id', renderMode: RenderMode.Client },
  { path: 'gestion/categorias', renderMode: RenderMode.Client },
  { path: 'gestion/horarios', renderMode: RenderMode.Client },
  { path: 'gestion/sedes', renderMode: RenderMode.Client },
  { path: 'gestion/estudiantes', renderMode: RenderMode.Client },
  { path: 'gestion/integraciones', renderMode: RenderMode.Client },
  { path: 'pagos', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server }
];
