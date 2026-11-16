import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AcademiaDemoService } from '../../core/academia-demo.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  readonly demo = inject(AcademiaDemoService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly denied = this.route.snapshot.data['denied'] === true;
  readonly mensaje = signal('');
  seleccionarPerfilDemo(perfil:'estudiante'|'administrador'):void {
    this.demo.establecerPerfilDemo(perfil);
    this.mensaje.set('Perfil de demostración activado: '+perfil+'. No concede permisos reales.');
  }

  async iniciar(): Promise<void> {
    this.mensaje.set('');
    try {
      await this.auth.iniciarSesion(this.route.snapshot.queryParamMap.get('returnUrl') || '/mis-matriculas');
    } catch (e) {
      this.mensaje.set(e instanceof Error ? e.message : 'No fue posible iniciar sesión.');
    }
  }
  async salir(): Promise<void> {
    try { await this.auth.cerrarSesion(); }
    catch { this.mensaje.set('No se pudo cerrar sesión en Keycloak.'); }
  }
}
