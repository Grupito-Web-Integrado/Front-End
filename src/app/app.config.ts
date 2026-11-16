import { ApplicationConfig, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { AuthService } from './core/auth.service';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';

// Keycloak requires a real realm/client and is deliberately not initialized with placeholder values.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).iniciar())
  ]
};
