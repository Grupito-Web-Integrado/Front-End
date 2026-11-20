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

test('Los fixtures de prueba de 35 cursos no se cargan en el navegador', () => {
  const catalog = read('src/app/core/demo-catalog.ts');
  const fichas = catalog.split('const FICHAS: Ficha[] = [')[1].split('];')[0];
  const countCourses = (fichas.match(/^ \['/gm) || []).length;
  assert.equal(countCourses,35);
  const categories = catalog.split('export const CATEGORIAS_DEMO: Categoria[] = [')[1].split('].map(')[0];
  const countCategories = (categories.match(/^  \['/gm) || []).length;
  assert.equal(countCategories,11);
  const store=read('src/app/core/academia-demo.service.ts');
  assert.ok(!store.includes("from './demo-catalog'"));
  assert.ok(!store.includes('localStorage.setItem('));
  assert.ok(store.includes("signal<'demo'|'api'>('api')"));
});

test('La matrícula utiliza exclusivamente la API y no anuncia perfiles ficticios', () => {
  const panel = read('src/app/features/academia-panel/academia-panel.ts');
  assert.ok(!panel.includes('Modo demostración</button>'));
  assert.ok(panel.includes('this.api.registrarMatricula('));
  assert.ok(panel.includes('this.api.listarMatriculas()'));
  assert.ok(panel.includes('No se realizará ningún cobro real'));
});


test('Keycloak usa PKCE, no depende de iframe de terceros y la SPA no persiste tokens', () => {
  const auth=read('src/app/core/auth.service.ts');
  const config=read('public/auth-config.json');
  const routes=read('src/app/app.routes.ts');
  assert.ok(auth.includes("pkceMethod: 'S256'"));
  assert.ok(auth.includes("checkLoginIframe: false"));
  assert.ok(!auth.includes("silentCheckSsoRedirectUri:"));
  assert.ok(!auth.includes("onLoad: 'check-sso'"));
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

test('Estados y modalidades del curso coinciden con enums del backend', () => {
  const model=read('src/app/core/academia.models.ts');
  for(const status of ['DRAFT','PUBLISHED','CANCELLED','COMPLETED']) assert.ok(model.includes("'"+status+"'"));
  assert.equal(model.includes("'IN_PROGRESS'"),false);
  assert.ok(model.includes("'IN_PERSON'"));
  assert.equal(model.includes("'PRESENTIAL'"),false);
});

test('La portada presenta seis categorías dinámicas con opción de expansión', () => {
  const catalog=read('src/app/features/catalogo-avanzado/catalogo-avanzado.ts');
  assert.ok(catalog.includes('this.categorias().slice(0,6)'));
  assert.ok(catalog.includes('this.api.categoriasActivasCompletas()'));
  assert.ok(catalog.includes('mostrarTodasCategorias'));
});

test('El editor del curso integra horarios y sedes, separado del público', () => {
  const editor=read('src/app/features/curso-admin/curso-admin.ts');
  assert.ok(editor.includes('guardarHorario()'));
  assert.ok(editor.includes('guardarSede()'));
  const routes=read('src/app/app.routes.ts');
  assert.ok(routes.includes("path: 'gestion/cursos/:id'"));
});

test('El acceso de estudiante y administrador requiere roles de Keycloak, sin selector demo', () => {
  const login=read('src/app/features/login/login.html');
  const routes=read('src/app/app.routes.ts');
  const interceptor=read('src/app/core/auth.interceptor.ts');
  assert.ok(login.includes("entrar('ESTUDIANTE')"));
  assert.ok(login.includes("entrar('ADMIN')"));
  assert.ok(!login.includes('Vista administrador'));
  assert.ok(routes.includes("rol: 'ESTUDIANTE'"));
  assert.ok(routes.includes("rol: 'ADMIN'"));
  assert.ok(interceptor.includes("req.url.startsWith('/api/matriculas/')"));
});

test('El Indexer de Joker se observa vía health y NO se consulta como buscador directo', () => {
  const proxy=JSON.parse(read('proxy.conf.json'));
  const api=read('src/app/core/academia-api.service.ts');
  assert.ok(proxy['/api/indexer/**']);
  assert.ok(api.includes("('/api/indexer/health')"));
  assert.ok(api.includes("${this.catalogo}/courses/published"));
});

test('Angular Vite proxies requests deeply into each backend', () => {
  const proxy=JSON.parse(read('proxy.conf.json'));
  for (const path of ['/api/v1/**','/api/pagos/**','/api/matriculas/**','/api/indexer/**']) {
    assert.ok(proxy[path], 'Sin wildcard Vite no reenvía las rutas hijas: '+path);
  }
  assert.equal(proxy['/api/indexer/**'].target,'http://127.0.0.1:8084');
});

test('Los dos roles tienen portal independiente y el menú móvil abre gestión', () => {
  const routes=read('src/app/app.routes.ts');
  const shell=read('src/app/app.html');
  const student=read('src/app/features/portal-estudiante/portal-estudiante.ts');
  const admin=read('src/app/features/portal-admin/portal-admin.ts');
  assert.ok(routes.includes("path: 'mi-espacio'"));
  assert.ok(routes.includes("path: 'gestion', component: PortalAdmin"));
  assert.ok(routes.includes("rol: 'ESTUDIANTE'"));
  assert.ok(routes.includes("rol: 'ADMIN'"));
  assert.ok(student.includes("this.api.listarMatriculas()"));
  assert.ok(admin.includes("this.api.listarMatriculasAdmin()"));
  assert.ok(shell.includes('nav-menu-toggle'));
  assert.ok(shell.includes('[attr.aria-expanded]'));
});

test('La confirmación de matrícula depende del comprobante real y evita doble envío', () => {
  const panel=read('src/app/features/academia-panel/academia-panel.ts');
  assert.ok(panel.includes('this.api.registrarMatricula('));
  assert.ok(panel.includes('if(this.cargando())return;'));
  assert.ok(panel.includes("state:{solicitud:{id:respuesta.id,estado:respuesta.estado}}"));
  assert.ok(panel.includes('@if(matriculaConfirmada();as solicitud)'));
  assert.ok(panel.includes('No existe un comprobante'));
});

test('El catálogo filtra antes de paginar y no permite matrícula sin cupos', () => {
  const catalog=read('src/app/features/catalogo-avanzado/catalogo-avanzado.ts');
  assert.ok(catalog.includes('readonly cursosFiltrados = computed('));
  assert.ok(catalog.includes('readonly totalPaginas = computed('));
  assert.ok(catalog.includes('this.cursosFiltrados().slice('));
  assert.ok(catalog.includes('this.categorias().slice(0,6)'));
  assert.ok(catalog.includes("if(curso.availableSlots>0)"));
  assert.ok(catalog.includes('this.api.enriquecerCursos(visibles)'));
});

test('La versión final puede mostrar solo el frontend sin inventar datos', () => {
  const launcher=read('VER_FRONTEND.bat');
  const app=read('src/app/core/academia-demo.service.ts');
  assert.ok(launcher.includes('ABRIR_FRONTEND.ps1'));
  assert.ok(!app.includes('localStorage.setItem('));
  assert.ok(app.includes("signal<'demo'|'api'>('api')"));
});
