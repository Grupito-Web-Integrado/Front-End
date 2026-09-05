import { APP_INITIALIZER, ApplicationConfig, PLATFORM_ID, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { routes } from './app.routes';
import { keycloak } from './core/keycloak.config';

function initializeKeycloak() {
  const platformId = inject(PLATFORM_ID);
  return () => {
    if (isPlatformBrowser(platformId)) {
      return keycloak.init({
        onLoad: 'check-sso',
        checkLoginIframe: false
      });
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true
    }
  ]
};