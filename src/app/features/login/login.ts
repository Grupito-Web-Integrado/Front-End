import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly denied = this.route.snapshot.data['denied'] === true;
  readonly mensaje = signal('');
  readonly procesando = signal(false);
  readonly esAdmin = computed(() => this.auth.tieneRol('ADMIN'));
  readonly esEstudiante = computed(() => this.auth.tieneRol('ESTUDIANTE'));

  async entrar(perfil:'ESTUDIANTE'|'ADMIN'):Promise<void> {
    this.mensaje.set('');
    this.procesando.set(true);
    try {
      const requested=this.route.snapshot.queryParamMap.get('returnUrl');
      const valid=requested && requested.startsWith('/') && !requested.startsWith('//');
      const destiny=perfil==='ADMIN'?'/gestion':'/mi-espacio';
      const target=valid && (perfil==='ADMIN' ? requested.startsWith('/gestion/') || requested.startsWith('/pagos') : requested.startsWith('/matricula/') || requested.startsWith('/mis-matriculas') || requested.startsWith('/mi-espacio'))
        ? requested : destiny;
      await this.auth.iniciarSesion(target,perfil);
    }catch(e){
      this.mensaje.set(e instanceof Error?e.message:'No se pudo conectar a Keycloak.');
      this.procesando.set(false);
    }
  }

  async salir():Promise<void> {
    try { await this.auth.cerrarSesion(); }
    catch { this.mensaje.set('No se pudo cerrar sesión en Keycloak.'); }
  }
}
