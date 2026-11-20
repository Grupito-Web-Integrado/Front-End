import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { protegerApi } from './identity.guard';

describe('protegerApi · roles reales de Keycloak', () => {
  const sesion=signal(false);
  const roles=signal<string[]>([]);
  const auth={
    iniciar:async()=>{},
    autenticado:sesion.asReadonly(),
    tieneRol:(rol:string)=>roles().includes(rol)
  };

  beforeEach(()=>{
    sesion.set(false);roles.set([]);
    TestBed.configureTestingModule({
      providers:[provideRouter([]),{provide:AuthService,useValue:auth}]
    });
  });
  const activar=async(rol:string,url:string)=>{
    const ruta={data:{rol}} as unknown as ActivatedRouteSnapshot;
    const estado={url} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(()=>protegerApi(ruta,estado));
  };

  it('redirige a login y conserva destino si no existe sesión',async()=>{
    const result=await activar('ADMIN','/gestion/cursos');
    const router=TestBed.inject(Router);
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/login?returnUrl=');
  });

  it('rechaza un usuario ESTUDIANTE en la administración',async()=>{
    sesion.set(true);roles.set(['ESTUDIANTE']);
    const result=await activar('ADMIN','/gestion');
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/acceso-denegado');
  });

  it('permite a ADMIN acceder a su panel',async()=>{
    sesion.set(true);roles.set(['ADMIN']);
    const result=await activar('ADMIN','/gestion');
    expect(result).toBe(true);
  });
});
