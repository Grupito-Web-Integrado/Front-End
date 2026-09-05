import { Routes } from '@angular/router';
import { Catalogo } from './features/catalogo/catalogo';
import { Matricula } from './features/matricula/matricula';
import { Confirmacion } from './features/confirmacion/confirmacion';
import { Login } from './features/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'catalogo', component: Catalogo },
  { path: 'matricula/:idCurso', component: Matricula },
  { path: 'confirmacion', component: Confirmacion }
];