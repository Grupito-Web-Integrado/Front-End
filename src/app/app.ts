import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AcademiaDemoService } from './core/academia-demo.service';
import { AuthService } from './core/auth.service';

@Component({
  selector:'app-root',
  standalone:true,
  imports:[RouterLink,RouterLinkActive,RouterOutlet],
  templateUrl:'./app.html',
  styleUrl:'./app.scss'
})
export class App {
  protected readonly demo=inject(AcademiaDemoService);
  protected readonly auth=inject(AuthService);
  protected readonly puedeAdministrar=computed(()=>this.demo.modo()==='demo'
    ? this.demo.perfilDemo()==='administrador'
    : this.auth.autenticado() && this.auth.tieneRol('ADMIN'));
}
