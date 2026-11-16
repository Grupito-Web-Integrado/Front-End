import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');

test('Angular tiene las rutas principales y administrativas', () => {
  const routes = read('src/app/app.routes.ts');
  for (const url of ['inicio','catalogo','curso/:id','matricula/:idCurso','mis-matriculas',
    'pagos','gestion/cursos','gestion/categorias','gestion/horarios','gestion/sedes',
    'gestion/estudiantes','gestion/integraciones']) {
    assert.ok(routes.includes("path: '"+url+"'"), 'falta ruta: '+url);
  }
});

test('Catálogo y pagos usan endpoints respaldados por controladores Java', () => {
  const service = read('src/app/core/academia-api.service.ts');
  for (const endpoint of ['courses/published','courses/autocomplete','course-categories/active',
    'courses/category/','course-schedules/course/','course-locations/course/','/api/pagos']) {
    assert.ok(service.includes(endpoint), 'falta endpoint: '+endpoint);
  }
});

test('El proyecto incluye búsqueda, filtros y tarjetas de curso', () => {
  const catalog = read('src/app/features/catalogo-avanzado/catalogo-avanzado.ts');
  assert.ok(catalog.includes('sugerencias'));
  assert.ok(catalog.includes('categoriaSeleccionada'));
  assert.ok(catalog.includes('precioMax'));
  assert.ok(catalog.includes('app-curso-card'));
});

test('No se inicia Keycloak con credenciales de ejemplo', () => {
  const config = read('src/app/app.config.ts');
  assert.equal(config.includes('keycloak.init('),false);
  assert.ok(config.includes('provideHttpClient'));
});

test('Existe un catálogo demo de 35 cursos y 11 categorías', () => {
  const catalog = read('src/app/core/demo-catalog.ts');
  const fichas = catalog.split('const FICHAS: Ficha[] = [')[1].split('];')[0];
  const countCourses = (fichas.match(/^ \['/gm) || []).length;
  assert.equal(countCourses,35);
  const categories = catalog.split('export const CATEGORIAS_DEMO: Categoria[] = [')[1].split('].map(')[0];
  const countCategories = (categories.match(/^  \['/gm) || []).length;
  assert.equal(countCategories,11);
});

test('El formulario de matrícula informa que opera en modo demostración', () => {
  const panel = read('src/app/features/academia-panel/academia-panel.ts');
  assert.ok(panel.includes('El microservicio de matrículas no ofrece todavía endpoints HTTP'));
  assert.ok(panel.includes('No se realizará ningún cobro real'));
});


test('Keycloak usa PKCE y la SPA no persiste tokens', () => {
  const auth=read('src/app/core/auth.service.ts');
  const config=read('public/auth-config.json');
  const routes=read('src/app/app.routes.ts');
  assert.ok(auth.includes("pkceMethod: 'S256'"));
  assert.ok(auth.includes("checkLoginIframe: false"));
  assert.ok(!auth.includes('localStorage.setItem('));
  assert.equal(JSON.parse(config).clientId,'myacademy-web');
  assert.ok(routes.includes("canActivate: [protegerApi]"));
});

test('La infraestructura y realm incluyen las bases y Keycloak', () => {
  const compose=read('infra/compose.yml');
  const realm=JSON.parse(read('infra/keycloak/myacademy-realm.json'));
  for(const svc of ['catalogo-db:','matricula-db:','keycloak-db:','keycloak:','elasticsearch:','redis:'])
    assert.ok(compose.includes(svc),'Falta servicio '+svc);
  assert.equal(realm.realm,'myacademy');
  assert.ok(realm.roles.realm.some(r=>r.name==='ADMIN'));
});
