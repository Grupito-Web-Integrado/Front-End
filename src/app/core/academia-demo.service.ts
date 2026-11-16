import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CATEGORIAS_DEMO, CURSOS_DEMO } from './demo-catalog';
import { Categoria, Curso, Matricula, Pago } from './academia.models';

@Injectable({ providedIn: 'root' })
export class AcademiaDemoService {
  private platformId = inject(PLATFORM_ID);
  readonly modo = signal<'demo' | 'api'>('demo');
  readonly cursos = signal<Curso[]>([...CURSOS_DEMO]);
  readonly categorias = signal<Categoria[]>([...CATEGORIAS_DEMO]);
  readonly matriculas = signal<Matricula[]>([]);
  readonly pagos = signal<Pago[]>([]);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.modo.set(localStorage.getItem('myacademy-modo') === 'api' ? 'api' : 'demo');
    this.cursos.set(this.leer('myacademy-cursos', CURSOS_DEMO));
    this.categorias.set(this.leer('myacademy-categorias', CATEGORIAS_DEMO));
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
