import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

/** Adjunta el JWT únicamente a los endpoints propios, nunca a dominios externos. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!(req.url.startsWith('/api/v1/') || req.url === '/api/pagos' || req.url.startsWith('/api/pagos/'))) {
    return next(req);
  }
  const auth = inject(AuthService);
  return from(auth.tokenAcceso()).pipe(switchMap(token => {
    const request = token ? req.clone({ setHeaders: { Authorization: 'Bearer ' + token } }) : req;
    return next(request);
  }));
};
