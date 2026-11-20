import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Comprueba el rol REAL del token; el backend también debe verificar JWT. */
export const protegerApi: CanActivateFn = async (route,state) => {
  // En SSR nunca bloquear el callback de Keycloak antes de inicializar PKCE.
  // Todas las rutas privadas están configuradas Client en app.routes.server.ts.
  if(!isPlatformBrowser(inject(PLATFORM_ID)))return true;
  const auth=inject(AuthService);
  const router=inject(Router);
  await auth.iniciar();
  if(!auth.autenticado()) {
    return router.createUrlTree(['/login'],{queryParams:{returnUrl:state.url}});
  }
  const rol=route.data['rol'] as string|undefined;
  if(rol && !auth.tieneRol(rol)) {
    return router.createUrlTree(['/acceso-denegado']);
  }
  return true;
};
