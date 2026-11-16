import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AcademiaDemoService } from './academia-demo.service';
import { AuthService } from './auth.service';

/** La UI se puede usar en demo. En modo API exige sesión y rol.
 *  Los controles del navegador NO sustituyen la verificación JWT en el backend. */
export const protegerApi: CanActivateFn = async (route, state) => {
  const demo = inject(AcademiaDemoService);
  if (demo.modo() === 'demo') {
    const rol=route.data['rol'] as string | undefined;
    if(rol==='ADMIN' && demo.perfilDemo()!=='administrador') return inject(Router).createUrlTree(['/acceso-denegado']);
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.iniciar();
  const login = () => router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  if (!auth.autenticado()) return login();
  const rol = route.data['rol'] as string | undefined;
  if (rol && !auth.tieneRol(rol)) return router.createUrlTree(['/acceso-denegado']);
  return true;
};
