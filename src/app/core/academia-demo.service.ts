import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CATEGORIAS_DEMO, CURSOS_DEMO } from './demo-catalog';
import { Categoria, Curso, Matricula, Pago } from './academia.models';

@Injectable({ providedIn: 'root' })
export class AcademiaDemoService {
  private platformId = inject(PLATFORM_ID);
  readonly modo = signal<'demo' | 'api'>('demo');
  readonly perfilDemo = signal<'estudiante' | 'administrador'>('estudiante');
  readonly cursos = signal<Curso[]>([...CURSOS_DEMO]);
  readonly categorias = signal<Categoria[]>([...CATEGORIAS_DEMO]);
  readonly matriculas = signal<Matricula[]>([]);
  readonly pagos = signal<Pago[]>([]);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.modo.set(localStorage.getItem('myacademy-modo') === 'api' ? 'api' : 'demo');
    this.perfilDemo.set(localStorage.getItem('myacademy-perfil-demo')==='administrador'?'administrador':'estudiante');
    const anteriores = this.leer<Curso[]>('myacademy-cursos', []);
    // Mantener altas/ediciones del usuario sin perder los nuevos cursos demo.
    const porId = new Map<string, Curso>();
    for (const base of CURSOS_DEMO) porId.set(base.id, base);
    for (const anterior of anteriores) {
      const actual = porId.get(anterior.id);
      const modalidad = anterior.modality === ('PRESENTIAL' as any) ? 'IN_PERSON' : anterior.modality;
      const estado = (['DRAFT','PUBLISHED','CANCELLED','COMPLETED'] as string[]).includes(anterior.status)
        ? anterior.status : 'DRAFT';
      porId.set(anterior.id, { ...actual, ...anterior, modality: modalidad as Curso['modality'],
        status: estado as Curso['status'], imageUrl: anterior.imageUrl || actual?.imageUrl,
        schedules: anterior.schedules || actual?.schedules || [],
        locations: anterior.locations || actual?.locations || [] });
    }
    this.cursos.set([...porId.values()]);
    const anterioresCategorias = this.leer<Categoria[]>('myacademy-categorias', []);
    const categorias = new Map<string, Categoria>(CATEGORIAS_DEMO.map(c=>[c.id,c]));
    for (const cat of anterioresCategorias) categorias.set(cat.id,cat);
    this.categorias.set([...categorias.values()]);
    this.matriculas.set(this.leer('myacademy-matriculas', []));
    this.pagos.set(this.leer('myacademy-pagos', []));
  }
  private leer<T>(clave: string, base: T): T {
    try { const raw = localStorage.getItem(clave); return raw ? JSON.parse(raw) as T : structuredClone(base); }
    catch { return structuredClone(base); }
  }
  private guardar(clave: string, valor: unknown): void {
    if (isPlatformBrowser(this.platformId)) localStorage.setItem(clave, JSON.stringify(valor));
  }
  establecerModo(modo: 'demo' | 'api'): void {
    this.modo.set(modo);
    this.guardar('myacademy-modo', modo);
  }
  establecerPerfilDemo(perfil:'estudiante'|'administrador'):void {
    this.perfilDemo.set(perfil);
    this.guardar('myacademy-perfil-demo', perfil);
  }
  registrarCurso(data: Curso): void {
    const arr = [...this.cursos(), data];
    this.cursos.set(arr);
    this.guardar('myacademy-cursos', arr);
  }
  actualizarCurso(id: string, cambios: Partial<Curso>): void {
    const arr = this.cursos().map(c => c.id === id ? { ...c, ...cambios } : c);
    this.cursos.set(arr);
    this.guardar('myacademy-cursos', arr);
  }
  registrarCategoria(data: Categoria): void {
    const arr = [...this.categorias(), data];
    this.categorias.set(arr);
    this.guardar('myacademy-categorias', arr);
  }
  actualizarCategoria(id: string, cambios: Partial<Categoria>): void {
    const arr = this.categorias().map(c => c.id === id ? { ...c, ...cambios } : c);
    this.categorias.set(arr);
    this.guardar('myacademy-categorias', arr);
    // Actualiza la asociación anidada de los cursos: evita mostrar el nombre antiguo.
    const actualizada = arr.find(c=>c.id===id);
    if (actualizada) {
      const cursos = this.cursos().map(c=>c.categoryId===id
        ? { ...c, categories:[actualizada] } : c);
      this.cursos.set(cursos);
      this.guardar('myacademy-cursos', cursos);
    }
  }
  registrarMatricula(data: Matricula): void {
    const arr = [data, ...this.matriculas()];
    this.matriculas.set(arr);
    this.guardar('myacademy-matriculas', arr);
  }
  registrarPago(monto: number): Pago {
    const pago: Pago = { id: Date.now(), monto, estado: 'EN_PROCESO' };
    const arr = [pago, ...this.pagos()];
    this.pagos.set(arr);
    this.guardar('myacademy-pagos', arr);
    return pago;
  }
  actualizarPago(id: number, estado: Pago['estado']): void {
    const arr = this.pagos().map(p => p.id === id ? { ...p, estado } : p);
    this.pagos.set(arr);
    this.guardar('myacademy-pagos', arr);
  }
}
