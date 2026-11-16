import { ApplicationConfig, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthService } from './core/auth.service';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';

// El callback OAuth se procesa sin iframe SSO; las rutas protegidas esperan iniciar() antes de validar roles.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).iniciar())
  ]
};
