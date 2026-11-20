import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademiaApiService } from '../../core/academia-api.service';
import { AuthService } from '../../core/auth.service';
import { Matricula } from '../../core/academia.models';

@Component({
  selector: 'app-portal-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <section class="shell workspace-section student-portal">
    <div class="detail-breadcrumb"><a routerLink="/inicio">Inicio</a> / Mi espacio</div>
    <div class="workspace-heading">
      <div><span class="section-overline">MYACADEMY · ESTUDIANTE</span>
        <h1>Tu espacio de aprendizaje</h1>
        <p>Hola, {{auth.usuario() || 'estudiante'}}. Consulta tus solicitudes y explora cursos.</p>
      </div>
      <a class="btn-outline" routerLink="/catalogo">Explorar cursos ↗</a>
    </div>
    <div class="student-summary">
      <div class="student-stat"><span>Mis solicitudes</span><strong>{{matriculas().length}}</strong><small>Recuperadas desde Matrículas</small></div>
      <div class="student-stat"><span>Confirmadas</span><strong>{{confirmadas()}}</strong><small>Según el estado del servicio</small></div>
      <div class="student-stat"><span>Pendientes</span><strong>{{pendientes()}}</strong><small>En proceso de revisión o pago</small></div>
    </div>
    <div class="table-card">
      <div class="table-heading">
        <div><h2>Mis matrículas</h2><p>Historial vinculado a tu cuenta de Keycloak.</p></div>
        <button class="btn-outline" type="button" [disabled]="cargando()" (click)="cargar()">Actualizar</button>
      </div>
      @if(error()){
        <div class="error-banner" role="alert">{{error()}} <button type="button" class="table-link" (click)="cargar()">Reintentar</button></div>
      }
      @if(cargando()) {
        <p class="empty-state" role="status">Consultando matrículas…</p>
      } @else if(!error()) {
        @if(matriculas().length>0) {
          <label class="form-field portal-filter"><span>Filtrar por estado</span>
            <select [ngModel]="filtro()" (ngModelChange)="filtro.set($event)">
              <option value="">Todos los estados</option>
              <option value="CREADA">Creada</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PENDIENTE_DE_PAGO">Pendiente de pago</option>
              <option value="PAGADA">Pagada</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="PAGO_RECHAZADO">Pago rechazado</option>
              <option value="PAGO_EXPIRADO">Pago expirado</option>
            </select>
          </label>
          <div class="table-scroll"><table>
            <thead><tr><th>Curso</th><th>Fecha</th><th>Importe</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              @for(m of visibles();track m.id) {
                <tr>
                  <td><strong>{{m.courseName || 'Curso asociado'}}</strong><small>Solicitud {{m.id.slice(0,8)}}</small></td>
                  <td>{{m.fecha ? (m.fecha | date:'mediumDate') : 'Pendiente'}}</td>
                  <td>S/ {{m.importe | number:'1.2-2'}}</td>
                  <td><span class="status-pill">{{estadoTexto(m.estado)}}</span></td>
                  <td><a class="table-link" [routerLink]="['/curso',m.courseId]">Ver curso</a></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="table-empty">No hay matrículas con ese estado.</td></tr>
              }
            </tbody>
          </table></div>
        } @else {
          <div class="empty-state portal-empty">
            <strong>Todavía no tienes solicitudes de matrícula.</strong>
            <span>Cuando el servicio registre una matrícula aparecerá aquí.</span>
            <a routerLink="/catalogo" class="btn-primary">Buscar mi primer curso ↗</a>
          </div>
        }
      }
    </div>
    <p class="mode-note">Una solicitud registrada no confirma por sí misma el pago ni la reserva definitiva del cupo.</p>
  </section>
  `
})
export class PortalEstudiante implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AcademiaApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly matriculas = signal<Matricula[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('');
  readonly visibles = computed(() => this.matriculas().filter(m => !this.filtro() || m.estado === this.filtro()));
  readonly confirmadas = computed(() => this.matriculas().filter(m => m.estado === 'CONFIRMADA').length);
  readonly pendientes = computed(() => this.matriculas().filter(m => ['PENDIENTE','CREADA','PENDIENTE_DE_PAGO'].includes(m.estado)).length);
  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    this.cargando.set(true); this.error.set('');
    this.api.listarMatriculas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: items => { this.matriculas.set(items); this.cargando.set(false); },
      error: err => {
        const status = err && typeof err === 'object' && 'status' in err ? String(err.status) : 'desconocido';
        this.error.set('No pudimos consultar Matrículas (HTTP ' + status + '). Comprueba tu sesión y el servicio.');
        this.cargando.set(false);
      }
    });
  }
  estadoTexto(value: Matricula['estado']): string {
    const nombres: Partial<Record<Matricula['estado'], string>> = {
      CREADA: 'Creada', PENDIENTE: 'Pendiente', PENDIENTE_DE_PAGO: 'Pendiente de pago',
      PAGADA: 'Pagada', CONFIRMADA: 'Confirmada', CANCELADA: 'Cancelada',
      PAGO_RECHAZADO: 'Pago rechazado', PAGO_EXPIRADO: 'Pago expirado'
    };
    return nombres[value] || value;
  }
}
