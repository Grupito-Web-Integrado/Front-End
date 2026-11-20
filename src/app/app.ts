import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector:'app-root',
  standalone:true,
  imports:[RouterLink,RouterLinkActive,RouterOutlet],
  templateUrl:'./app.html',
  styleUrl:'./app.scss'
})
export class App {
  protected readonly auth=inject(AuthService);
  protected readonly menuAbierto=signal(false);
  protected readonly puedeAdministrar=computed(()=>this.auth.autenticado() && this.auth.tieneRol('ADMIN'));
  protected readonly esEstudiante=computed(()=>this.auth.autenticado() && this.auth.tieneRol('ESTUDIANTE'));
}
