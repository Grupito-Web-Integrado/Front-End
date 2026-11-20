import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth.service';
import { AcademiaApiService } from '../../core/academia-api.service';

@Component({
  selector: 'app-portal-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <section class="shell workspace-section admin-portal">
    <div class="detail-breadcrumb"><a routerLink="/inicio">Inicio</a> / Administración</div>
    <div class="workspace-heading">
      <div><span class="section-overline">MYACADEMY · ADMINISTRACIÓN</span>
        <h1>Panel de control</h1>
        <p>Bienvenido, {{auth.usuario() || 'administrador'}}. Gestiona la oferta académica y sus servicios.</p>
      </div>
      <button class="btn-outline" type="button" [disabled]="cargando()" (click)="cargar()">Actualizar datos</button>
    </div>
    @if(cargando()){<p role="status" class="mode-note">Consultando los servicios…</p>}
    @if(error()){<p role="alert" class="error-banner">{{error()}}</p>}
    <div class="admin-stats">
      <div class="student-stat"><span>Cursos</span><strong>{{cursos() ?? '—'}}</strong><small>Catálogo</small></div>
      <div class="student-stat"><span>Categorías</span><strong>{{categorias() ?? '—'}}</strong><small>Catálogo</small></div>
      <div class="student-stat"><span>Solicitudes</span><strong>{{matriculas() ?? '—'}}</strong><small>Matrículas</small></div>
      <div class="student-stat"><span>Movimientos de pago</span><strong>{{pagos() ?? '—'}}</strong><small>Pagos</small></div>
    </div>
    <div class="portal-actions">
      <a routerLink="/gestion/cursos" class="portal-action">
        <span class="portal-action-icon">▦</span><strong>Cursos, horarios y sedes</strong>
        <small>Crear, modificar, publicar y administrar programas.</small>
        <span class="portal-action-arrow">Abrir ↗</span>
      </a>
      <a routerLink="/gestion/categorias" class="portal-action">
        <span class="portal-action-icon">◈</span><strong>Categorías</strong>
        <small>Registrar, activar, desactivar y editar categorías.</small>
        <span class="portal-action-arrow">Abrir ↗</span>
      </a>
      <a routerLink="/gestion/estudiantes" class="portal-action">
        <span class="portal-action-icon">☷</span><strong>Solicitudes de matrícula</strong>
        <small>Consultar las solicitudes de los estudiantes.</small>
        <span class="portal-action-arrow">Abrir ↗</span>
      </a>
      <a routerLink="/pagos" class="portal-action">
        <span class="portal-action-icon">◎</span><strong>Movimientos de pago</strong>
        <small>Consultar el servicio, sin procesar cobros bancarios.</small>
        <span class="portal-action-arrow">Abrir ↗</span>
      </a>
      <a routerLink="/gestion/integraciones" class="portal-action">
        <span class="portal-action-icon">↗</span><strong>Estado de servicios</strong>
        <small>Comprobar Catálogo, Indexer de Joker, Matrículas y Pagos.</small>
        <span class="portal-action-arrow">Diagnosticar ↗</span>
      </a>
    </div>
    <p class="mode-note">Los indicadores se recuperan de las APIs. «—» significa que un servicio no respondió; no se muestran datos ficticios.</p>
  </section>
  `
})
export class PortalAdmin implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(AcademiaApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly cursos = signal<number | null>(null);
  readonly categorias = signal<number | null>(null);
  readonly matriculas = signal<number | null>(null);
  readonly pagos = signal<number | null>(null);
  ngOnInit(): void { this.cargar(); }
  cargar(): void {
    this.cargando.set(true); this.error.set('');
    forkJoin({
      cursos: this.api.buscarCriterios({},0,1).pipe(catchError(() => of(null))),
      categorias: this.api.todasCategorias(0,1).pipe(catchError(() => of(null))),
      matriculas: this.api.listarMatriculasAdmin().pipe(catchError(() => of(null))),
      pagos: this.api.listarPagos().pipe(catchError(() => of(null)))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        this.cursos.set(data.cursos?.totalElements ?? null);
        this.categorias.set(data.categorias?.totalElements ?? null);
        this.matriculas.set(data.matriculas?.length ?? null);
        this.pagos.set(data.pagos?.length ?? null);
        if(Object.values(data).some(item => item === null))
          this.error.set('Algunos servicios no respondieron. Consulta el panel de integraciones.');
        this.cargando.set(false);
      },
      error: () => { this.error.set('No se pudieron consultar los servicios.'); this.cargando.set(false); }
    });
  }
}
