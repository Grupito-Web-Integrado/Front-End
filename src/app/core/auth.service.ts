import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type Keycloak from 'keycloak-js';

/**
 * Autenticación OpenID Connect en navegador, Authorization Code + PKCE S256.
 * Los tokens permanecen solo en la memoria del adaptador; no se guardan en localStorage.
 * La protección real de datos también debe implementarse en los microservicios.
 */
export interface ConfiguracionIdentidad {
  enabled: boolean;
  url: string;
  realm: string;
  clientId: string;
}
export type EstadoIdentidad = 'servidor' | 'iniciando' | 'disponible' | 'no-configurado' | 'sin-conexion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platform = inject(PLATFORM_ID);
  private adapter: Keycloak | null = null;
  private startPromise: Promise<void> | null = null;
  readonly estado = signal<EstadoIdentidad>('iniciando');
  readonly autenticado = signal(false);
  readonly usuario = signal('');
  readonly roles = signal<string[]>([]);
  readonly error = signal('');

  async iniciar(): Promise<void> {
    if (!isPlatformBrowser(this.platform)) {
      this.estado.set('servidor');
      return;
    }
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.iniciarNavegador();
    return this.startPromise;
  }

  private async iniciarNavegador(): Promise<void> {
    try {
      const respuesta = await fetch('/auth-config.json', { cache: 'no-store' });
      if (!respuesta.ok) throw new Error('No se pudo cargar auth-config.json');
      const cfg = await respuesta.json() as ConfiguracionIdentidad;
      if (!cfg.enabled || !cfg.url || !cfg.realm || !cfg.clientId) {
        this.estado.set('no-configurado'); return;
      }
      const modulo = await import('keycloak-js');
      const adapter = new modulo.default({
        url: cfg.url, realm: cfg.realm, clientId: cfg.clientId
      });
      this.adapter = adapter;
      adapter.onAuthSuccess = () => this.sincronizar();
      adapter.onAuthRefreshSuccess = () => this.sincronizar();
      adapter.onAuthLogout = () => this.limpiar();
      adapter.onAuthRefreshError = () => this.limpiar();
      // Procesa el callback OAuth al regresar de Keycloak sin comprobar SSO en un
      // iframe de terceros. El chequeo silencioso anterior bloqueaba el login.
      // La sesión se inicia EXPLÍCITAMENTE con login() desde un botón.
      await adapter.init({
        checkLoginIframe: false,
        pkceMethod: 'S256'
      });
      this.sincronizar();
      this.estado.set('disponible');
      this.error.set('');
    } catch (error) {
      this.adapter = null;
      this.estado.set('sin-conexion');
      this.error.set(error instanceof Error ? error.message : 'No se pudo conectar a Keycloak');
      this.limpiar();
    }
  }

  private sincronizar(): void {
    const client = this.adapter;
    this.autenticado.set(client?.authenticated === true);
    this.usuario.set(String(client?.tokenParsed?.['preferred_username'] || ''));
    const realmRoles = client?.realmAccess?.roles || [];
    const clientRoles = Object.values(client?.resourceAccess || {}).flatMap(r => r.roles || []);
    this.roles.set([...new Set([...realmRoles, ...clientRoles])]);
  }

  private limpiar(): void {
    this.autenticado.set(false);
    this.usuario.set('');
    this.roles.set([]);
  }

  tieneRol(rol: string): boolean {
    return this.roles().some(r => r.toUpperCase() === rol.toUpperCase());
  }

  async iniciarSesion(returnUrl = '/mis-matriculas', perfil: 'ESTUDIANTE' | 'ADMIN' = 'ESTUDIANTE'): Promise<void> {
    await this.iniciar();
    if (this.estado() !== 'disponible' || !this.adapter) {
      throw new Error(this.error() || 'Keycloak no responde en http://localhost:8180. Inicia la infraestructura e inténtalo nuevamente.');
    }
    const ruta = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/mis-matriculas';
    // No se concede un rol desde el frontend: solo se solicita autenticación.
    // Tras el callback, las rutas validan el rol real contenido en el JWT.
    const destino = perfil === 'ADMIN' ? '/gestion/cursos' : '/mis-matriculas';
    await this.adapter.login({ redirectUri: window.location.origin + (ruta || destino), prompt: 'login' });
  }

  async cerrarSesion(): Promise<void> {
    if (!this.adapter || !isPlatformBrowser(this.platform)) return;
    await this.adapter.logout({ redirectUri: window.location.origin + '/inicio' });
  }

  async tokenAcceso(): Promise<string | null> {
    if (!this.adapter?.authenticated) return null;
    try {
      await this.adapter.updateToken(30);
      this.sincronizar();
      return this.adapter.token || null;
    } catch {
      this.limpiar();
      throw new Error('La sesión ha expirado. Vuelve a iniciar sesión.');
    }
  }
}
