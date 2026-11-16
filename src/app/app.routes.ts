import { Routes } from '@angular/router';
import { CatalogoAvanzado } from './features/catalogo-avanzado/catalogo-avanzado';
import { AcademiaPanel } from './features/academia-panel/academia-panel';
import { Login } from './features/login/login';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'inicio', component: CatalogoAvanzado },
  { path: 'catalogo', component: CatalogoAvanzado },
  { path: 'curso/:id', component: CatalogoAvanzado, data: { vista: 'detalle' } },
  { path: 'matricula/:idCurso', component: AcademiaPanel, data: { vista: 'matricula' } },
  { path: 'confirmacion', component: AcademiaPanel, data: { vista: 'confirmacion' } },
  { path: 'mis-matriculas', component: AcademiaPanel, data: { vista: 'matriculas' } },
  { path: 'pagos', component: AcademiaPanel, data: { vista: 'pagos' } },
  { path: 'gestion/cursos', component: AcademiaPanel, data: { vista: 'cursos' } },
  { path: 'gestion/categorias', component: AcademiaPanel, data: { vista: 'categorias' } },
  { path: 'gestion/horarios', component: AcademiaPanel, data: { vista: 'horarios' } },
  { path: 'gestion/sedes', component: AcademiaPanel, data: { vista: 'sedes' } },
  { path: 'gestion/estudiantes', component: AcademiaPanel, data: { vista: 'estudiantes' } },
  { path: 'gestion/integraciones', component: AcademiaPanel, data: { vista: 'integraciones' } },
  { path: 'login', component: Login },
  { path: '**', redirectTo: 'inicio' }
];
