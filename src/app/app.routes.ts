import { Routes } from '@angular/router';
import { CatalogoAvanzado } from './features/catalogo-avanzado/catalogo-avanzado';
import { AcademiaPanel } from './features/academia-panel/academia-panel';
import { Login } from './features/login/login';
import { protegerApi } from './core/identity.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'inicio', component: CatalogoAvanzado },
  { path: 'catalogo', component: CatalogoAvanzado },
  { path: 'curso/:id', component: CatalogoAvanzado, data: { vista: 'detalle' } },
  { path: 'matricula/:idCurso', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'matricula' } },
  { path: 'confirmacion', component: AcademiaPanel, data: { vista: 'confirmacion' } },
  { path: 'mis-matriculas', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'matriculas' } },
  { path: 'pagos', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'pagos', rol: 'ADMIN' } },
  { path: 'gestion/cursos', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'cursos', rol: 'ADMIN' } },
  { path: 'gestion/categorias', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'categorias', rol: 'ADMIN' } },
  { path: 'gestion/horarios', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'horarios', rol: 'ADMIN' } },
  { path: 'gestion/sedes', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'sedes', rol: 'ADMIN' } },
  { path: 'gestion/estudiantes', component: AcademiaPanel, canActivate: [protegerApi], data: { vista: 'estudiantes', rol: 'ADMIN' } },
  { path: 'gestion/integraciones', component: AcademiaPanel, data: { vista: 'integraciones' } },
  { path: 'login', component: Login },
  { path: 'acceso-denegado', component: Login, data: { denied: true } },
  { path: '**', redirectTo: 'inicio' }
];
