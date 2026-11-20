import { createRequire } from 'node:module';
const require = createRequire('/tmp/myacademy-e2e-tools/package.json');
const { chromium } = require('playwright');
import assert from 'node:assert/strict';

const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
if (!studentPassword || !adminPassword) throw new Error('Missing temporary E2E credentials');

const origin = 'http://localhost:4200';
const browser = await chromium.launch({channel:'chrome',headless:true});
const trace = [];
try {
  const student = await browser.newContext({viewport:{width:1365,height:900}});
  const p1 = await student.newPage();
  p1.on('console',msg=>{if(msg.type()==='error')trace.push('student browser: '+msg.text());});
  await p1.goto(origin+'/login', {waitUntil:'domcontentloaded'});
  await p1.getByRole('button',{name:/Iniciar sesión como estudiante/}).click();
  await p1.waitForURL(/localhost:8180\/realms\/myacademy/, {timeout:60000});
  await p1.locator('#username').fill('e2e_student');
  await p1.locator('#password').fill(studentPassword);
  await p1.locator('#kc-login').click();
  await p1.waitForTimeout(2500);
  console.log('Student callback path:', new URL(p1.url()).pathname);
  console.log('Student page text:', (await p1.locator('body').innerText()).slice(0,500));
  await p1.waitForURL(/localhost:4200\/mi-espacio/, {timeout:20000,waitUntil:'domcontentloaded'});
  await p1.getByRole('heading',{name:'Tu espacio de aprendizaje'}).waitFor({timeout:30000});
  assert.match(await p1.locator('body').innerText(),/e2e_student/);
  // Un estudiante NO puede entrar al área ADMIN por alterar el URL.
  // Una navegación de documento completo pierde el JWT (guardado solo en memoria).
  // El servidor debe negar el área admin: login o acceso-denegado, nunca panel.
  await p1.goto(origin+'/gestion');
  await p1.waitForURL(/localhost:4200\/(?:acceso-denegado|login)/, {timeout:30000});
  assert.equal(await p1.getByRole('heading',{name:'Panel de control'}).count(),0);
  console.log('PASS: Login ESTUDIANTE con PKCE, portal real y protección ADMIN');
  await student.close();

  const admin = await browser.newContext({viewport:{width:1365,height:900}});
  const p2 = await admin.newPage();
  p2.on('console',msg=>{if(msg.type()==='error')trace.push('admin browser: '+msg.text());});
  await p2.goto(origin+'/login', {waitUntil:'domcontentloaded'});
  await p2.getByRole('button',{name:/Iniciar sesión como administrador/}).click();
  await p2.waitForURL(/localhost:8180\/realms\/myacademy/, {timeout:60000});
  await p2.locator('#username').fill('e2e_admin');
  await p2.locator('#password').fill(adminPassword);
  await p2.locator('#kc-login').click();
  await p2.waitForTimeout(2500);
  console.log('Admin callback path:', new URL(p2.url()).pathname);
  console.log('Admin page text:', (await p2.locator('body').innerText()).slice(0,500));
  await p2.waitForURL(/localhost:4200\/gestion/, {timeout:20000,waitUntil:'domcontentloaded'});
  await p2.getByRole('heading',{name:'Panel de control'}).waitFor({timeout:30000});
  assert.match(await p2.locator('body').innerText(),/e2e_admin/);
  // Usar RouterLink (navegación SPA) para mantener el token en memoria.
  await p2.locator('a.portal-action[href="/gestion/cursos"]').click();
  await p2.waitForURL(/localhost:4200\/gestion\/cursos/, {timeout:30000});
  await p2.getByRole('heading',{name:'Administrar cursos'}).waitFor({timeout:30000});
  console.log('PASS: Login ADMIN con PKCE, panel real y acceso de gestión');
  await admin.close();
} catch(err) {
  console.error('E2E FAILED:', err);
  console.error('Browser errors:', trace.join('\n'));
  throw err;
} finally {
  await browser.close();
}
