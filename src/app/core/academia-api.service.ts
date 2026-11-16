import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, switchMap } from 'rxjs';
import { Categoria, Curso, DiagnosticoApi, Horario, PageResult, Pago, Sede, Sugerencia } from './academia.models';

/**
 * Contratos contrastados con los controladores Java de Catalogo-Cursos-Publico-1A
 * y Estados_de_Pago. El microservicio Matricula-Publico_1E aún no ofrece API HTTP.
 */
@Injectable({ providedIn: 'root' })
export class AcademiaApiService {
  private http = inject(HttpClient);
  private catalogo = '/api/v1';
  private pagos = '/api/pagos';

  /** La respuesta CourseSummaryDto no contiene categorías: se consultan los detalles visibles. */
  enriquecerCursos(cursos: Curso[]): Observable<Curso[]> {
    if (!cursos.length) return of([]);
    return forkJoin(cursos.map(resumen => this.curso(resumen.id).pipe(
      map(detalle => ({ ...resumen, ...detalle,
        categoryId: detalle.categories?.[0]?.id || resumen.categoryId })),
      catchError(() => of(resumen))
    )));
  }
  categoriasActivasCompletas(): Observable<Categoria[]> {
    return this.categorias(0,100).pipe(switchMap(primera => {
      const total = Math.min(Math.max(primera.totalPages,1),100);
      if (total <= 1) return of(primera.content);
      const adicionales = Array.from({length:total-1},(_,i)=>this.categorias(i+1,100));
      return forkJoin(adicionales).pipe(map(resto => [
        ...primera.content, ...resto.flatMap(p=>p.content)
      ]));
    }));
  }
  cursosPublicados(page = 0, size = 50): Observable<PageResult<Curso>> {
    return this.http.get<PageResult<Curso>>(`${this.catalogo}/courses/published`, { params: { page, size } });
  }
  buscarCursos(text: string, page = 0, size = 50): Observable<PageResult<Curso>> {
    return this.http.get<PageResult<Curso>>(`${this.catalogo}/courses`, { params: { text, page, size } });
  }
  buscarCriterios(filtros: { name?: string; code?: string; modality?: string; status?: string }, page = 0, size = 50): Observable<PageResult<Curso>> {
    let params = new HttpParams().set('page', page).set('size', size);
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(clave, valor);
    }
    return this.http.get<PageResult<Curso>>(`${this.catalogo}/courses/search-criteria`, { params });
  }
  sugerencias(text: string, limit = 6): Observable<Sugerencia[]> {
    return this.http.get<Sugerencia[]>(`${this.catalogo}/courses/autocomplete`, { params: { text, limit } });
  }
  curso(id: string): Observable<Curso> { return this.http.get<Curso>(`${this.catalogo}/courses/${encodeURIComponent(id)}`); }
  categorias(page = 0, size = 100): Observable<PageResult<Categoria>> {
    return this.http.get<PageResult<Categoria>>(`${this.catalogo}/course-categories/active`, { params: { page, size } });
  }
  todasCategorias(page = 0, size = 100): Observable<PageResult<Categoria>> {
    return this.http.get<PageResult<Categoria>>(`${this.catalogo}/course-categories/all`, { params: { page, size } });
  }
  cursosPorCategoria(categoryId: string, page = 0, size = 50): Observable<PageResult<Curso>> {
    return this.http.get<PageResult<Curso>>(`${this.catalogo}/courses/category/${encodeURIComponent(categoryId)}`, { params: { page, size } });
  }
  horarios(courseId: string, page = 0, size = 100): Observable<PageResult<Horario>> {
    return this.http.get<PageResult<Horario>>(`${this.catalogo}/course-schedules/course/${encodeURIComponent(courseId)}`, { params: { page, size } });
  }
  sedes(courseId: string, page = 0, size = 100): Observable<PageResult<Sede>> {
    return this.http.get<PageResult<Sede>>(`${this.catalogo}/course-locations/course/${encodeURIComponent(courseId)}`, { params: { page, size } });
  }
  crearCurso(body: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.catalogo}/courses`, body);
  }
  publicarCurso(id: string): Observable<unknown> { return this.http.patch(`${this.catalogo}/courses/${id}/publish`, {}); }
  cancelarCurso(id: string): Observable<unknown> { return this.http.patch(`${this.catalogo}/courses/${id}/cancel`, {}); }
  completarCurso(id: string): Observable<unknown> { return this.http.patch(`${this.catalogo}/courses/${id}/complete`, {}); }
  cambiarNombreCurso(id: string, name: string): Observable<unknown> { return this.http.patch(`${this.catalogo}/courses/${id}/name`, { name }); }
  cambiarPrecioCurso(id: string, amount: number, currency = 'PEN'): Observable<unknown> {
    return this.http.patch(`${this.catalogo}/courses/${id}/price`, { amount, currency });
  }
  cambiarDescripcionCurso(id: string, description: string): Observable<unknown> {
    return this.http.patch(`${this.catalogo}/courses/${id}/description`, { description });
  }
  crearCategoria(body: Pick<Categoria, 'name' | 'description' | 'status'>): Observable<unknown> {
    return this.http.post(`${this.catalogo}/course-categories`, body);
  }
  activarCategoria(id: string): Observable<unknown> { return this.http.patch(`${this.catalogo}/course-categories/${id}/activate`, {}); }
  desactivarCategoria(id: string): Observable<unknown> { return this.http.patch(`${this.catalogo}/course-categories/${id}/deactivate`, {}); }
  renombrarCategoria(id: string, name: string): Observable<unknown> {
    return this.http.patch(`${this.catalogo}/course-categories/${id}/name`, { name });
  }
  descripcionCategoria(id: string, description: string): Observable<unknown> {
    return this.http.patch(`${this.catalogo}/course-categories/${id}/description`, { description });
  }
  crearHorario(body: Omit<Horario, 'id'>): Observable<unknown> {
    return this.http.post(`${this.catalogo}/course-schedules`, body);
  }
  editarHorario(id: string, campo: 'day'|'start-time'|'end-time'|'room', valor: string): Observable<unknown> {
    const clave: Record<typeof campo, string> = {
      'day': 'dayOfWeek', 'start-time': 'startTime', 'end-time': 'endTime', 'room': 'room'
    };
    return this.http.patch(`${this.catalogo}/course-schedules/${id}/${campo}`, { [clave[campo]]: valor });
  }
  crearSede(body: Omit<Sede, 'id'>): Observable<unknown> {
    return this.http.post(`${this.catalogo}/course-locations`, body);
  }
  editarSede(id: string, campo: 'name'|'address'|'city'|'reference'|'capacity', valor: string | number): Observable<unknown> {
    return this.http.patch(`${this.catalogo}/course-locations/${id}/${campo}`, { [campo]: valor });
  }
  listarPagos(): Observable<Pago[]> { return this.http.get<Pago[]>(this.pagos); }
  pago(id: number): Observable<Pago> { return this.http.get<Pago>(`${this.pagos}/${id}`); }
  crearPago(monto: number): Observable<Pago> {
    return this.http.post<Pago>(this.pagos, null, { params: { monto } });
  }
  confirmarPago(id: number): Observable<Pago> { return this.http.post<Pago>(`${this.pagos}/${id}/confirmar`, {}); }
  cancelarPago(id: number): Observable<Pago> { return this.http.post<Pago>(`${this.pagos}/${id}/cancelar`, {}); }
  cambiarEstadoPago(id: number, estado: Pago['estado']): Observable<Pago> {
    return this.http.patch<Pago>(`${this.pagos}/${id}/estado`, null, { params: { estado } });
  }
  diagnosticar(): Observable<DiagnosticoApi[]> {
    return forkJoin([
      this.http.get<number>(`${this.catalogo}/courses/count`).pipe(map(count => ({nombre:'Catálogo',estado:'online' as const,detalle:`${count} cursos registrados`}))),
      this.http.get<Pago[]>(this.pagos).pipe(map(items => ({nombre:'Pagos',estado:'online' as const,detalle:`${items.length} pagos registrados`})))
    ]);
  }
}
