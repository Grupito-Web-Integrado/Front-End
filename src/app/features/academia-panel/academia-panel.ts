import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { from, concatMap, toArray } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademiaApiService } from '../../core/academia-api.service';
import { AcademiaDemoService } from '../../core/academia-demo.service';
import { Categoria, Curso, Horario, Sede, Pago, DiagnosticoApi, Matricula } from '../../core/academia.models';

@Component({
  selector:'app-academia-panel',
  standalone:true,
  imports:[CommonModule, FormsModule, RouterLink],
  template: `
  <section class="shell workspace-section">
    <div class="detail-breadcrumb"><a routerLink="/inicio">Inicio</a> / {{ titulo() }}</div>
    <div class="workspace-heading"><div><span class="section-overline">MYACADEMY · {{ demo.modo()==='demo' ? 'MODO DEMOSTRACIÓN' : 'MODO API' }}</span><h1>{{ titulo() }}</h1><p>{{ subtitulo() }}</p></div><a routerLink="/catalogo" class="btn-outline">← Volver al catálogo</a></div>
    @if (mensaje()) { <div class="success-banner" role="status">{{ mensaje() }}</div> }
    @if (error()) { <div class="error-banner" role="alert">{{ error() }}</div> }
    @if (cargando()) { <p class="mode-note">Cargando datos…</p> }

    @if (vista==='matricula') {
      @if (cursoActual(); as curso) {
        <div class="form-layout">
          <form class="form-card" (ngSubmit)="registrarMatricula()">
            <h2>Datos del estudiante</h2>
            <p class="mode-note">{{ demo.modo()==='demo' ? 'Matrícula de demostración, guardada en este navegador.' : 'Solicitud al microservicio de Matrículas; el pago y la reserva definitiva de cupos todavía no están integrados.' }}</p>
            <div class="form-grid">
              <label class="form-field wide"><span>Nombre completo *</span><input name="nombre" [(ngModel)]="formMatricula.nombre" required minlength="3" placeholder="Nombres y apellidos"></label>
              <label class="form-field"><span>Correo electrónico *</span><input name="correo" type="email" [(ngModel)]="formMatricula.correo" required placeholder="correo@ejemplo.com"></label>
              <label class="form-field"><span>Teléfono</span><input name="telefono" [(ngModel)]="formMatricula.telefono" placeholder="Número de contacto"></label>
              <label class="form-field"><span>Tipo de documento</span><select name="tipoDoc" [(ngModel)]="formMatricula.tipoDocumento"><option>DNI</option><option>CE</option><option>PASAPORTE</option></select></label>
              <label class="form-field"><span>Número de documento *</span><input name="documento" [(ngModel)]="formMatricula.documento" required placeholder="Documento de identidad"></label>
            </div>
            <button class="btn-primary" type="submit">{{ demo.modo()==='demo' ? 'Registrar matrícula de prueba' : 'Solicitar matrícula' }} ↗</button>
          </form>
          <aside class="summary-card"><span class="section-overline">TU ELECCIÓN</span><h2>{{ curso.name }}</h2><p>{{ curso.modality }} · {{ curso.durationHours || '—' }} horas</p><div class="divider-line"></div><div class="total-row"><span>Importe</span><strong>S/ {{ curso.price | number:'1.2-2' }}</strong></div><small>No se realizará ningún cobro real.</small></aside>
        </div>
      } @else { <div class="empty-state">No se encontró el curso. <a routerLink="/catalogo">Volver a buscar</a></div> }
    }
    @if (vista==='confirmacion') {
      <div class="form-card confirmation-box"><span class="big-check">✓</span><h2>{{ demo.modo()==='demo'?'Matrícula demo registrada':'Solicitud de matrícula registrada' }}</h2><p>{{ demo.modo()==='demo'?'Registro guardado en este navegador.':'La solicitud fue almacenada en PostgreSQL. El pago y la reserva definitiva de cupos no se han realizado.' }}</p><a class="btn-primary" routerLink="/mis-matriculas">Ver mis matrículas</a></div>
    }
    @if (vista==='matriculas' || vista==='estudiantes') {
      <div class="table-card"><div class="table-heading"><h2>{{ vista==='estudiantes'?'Estudiantes registrados (demo)':'Historial de matrículas' }}</h2><button class="btn-outline" (click)="exportarMatriculas()">Exportar CSV</button></div>
        <div class="table-scroll"><table><thead><tr><th>Estudiante</th><th>Documento</th><th>Curso</th><th>Fecha</th><th>Importe</th><th>Estado</th></tr></thead><tbody>
        @for (m of matriculasVisibles(); track m.id) { <tr><td><strong>{{m.nombre}}</strong><small>{{m.correo}}</small></td><td>{{m.tipoDocumento}} {{m.documento}}</td><td>{{m.courseName}}</td><td>{{m.fecha | date:'short'}}</td><td>S/ {{m.importe | number:'1.2-2'}}</td><td><span class="status-pill">{{m.estado}}</span></td></tr> }
        @if (matriculasVisibles().length===0) { <tr><td colspan="6" class="table-empty">No hay matrículas registradas con este perfil.</td></tr> }
        </tbody></table></div>
      </div>
    }
    @if (vista==='pagos') {
      <div class="form-card compact-form"><h2>Registrar pago {{demo.modo()==='demo'?'de demostración':'en servicio de pruebas'}}</h2><p>Los estados del servicio de pagos son EN_PROCESO, PAGADO y CANCELADO. Este formulario no inicia un pago con tarjeta.</p><div class="inline-form"><label class="form-field"><span>Monto (S/)</span><input type="number" name="monto" [(ngModel)]="montoPago" min="0.01" step="0.01"></label><button class="btn-primary" (click)="crearPago()">Crear registro</button></div></div>
      <div class="table-card"><div class="table-heading"><h2>Registros de pago</h2><button class="btn-outline" (click)="cargarPagos()">Actualizar</button></div><div class="table-scroll"><table><thead><tr><th>ID</th><th>Monto</th><th>Estado</th><th>Acción</th></tr></thead><tbody>
      @for (p of pagosVisibles(); track p.id) { <tr><td>#{{p.id}}</td><td>S/ {{p.monto|number:'1.2-2'}}</td><td><span class="status-pill">{{p.estado}}</span></td><td>@if(p.estado==='EN_PROCESO'){<button class="table-link" (click)="cambiarPago(p,'PAGADO')">Confirmar</button><button class="table-link danger" (click)="cambiarPago(p,'CANCELADO')">Cancelar</button>} @else { — }</td></tr> }
      @if(pagosVisibles().length===0){<tr><td colspan="4" class="table-empty">No hay registros de pago.</td></tr>}
      </tbody></table></div></div>
    }

    @if (vista==='cursos') {
      <div class="form-card"><h2>Crear curso</h2><p>La estructura sigue los campos de CreateCourseBody del microservicio de catálogo.</p>
        <div class="form-grid">
          <label class="form-field"><span>Código *</span><input name="codigo" [(ngModel)]="nuevoCurso.code" placeholder="CUR-001"></label>
          <label class="form-field"><span>Nombre *</span><input name="curso" [(ngModel)]="nuevoCurso.name" placeholder="Nombre del programa"></label>
          <label class="form-field wide"><span>Descripción</span><textarea name="description" [(ngModel)]="nuevoCurso.description" rows="2"></textarea></label>
          <label class="form-field"><span>Categoría *</span><select name="categoryId" [(ngModel)]="nuevoCurso.categoryId"><option value="">Seleccionar</option>@for (c of categoriasVisibles();track c.id){<option [value]="c.id">{{c.name}}</option>}</select></label>
          <label class="form-field"><span>Modalidad</span><select name="modality" [(ngModel)]="nuevoCurso.modality"><option value="ONLINE">Online</option><option value="HYBRID">Híbrido</option><option value="IN_PERSON">Presencial</option></select></label>
          <label class="form-field"><span>Precio (S/)</span><input type="number" name="price" [(ngModel)]="nuevoCurso.price" min="0"></label>
          <label class="form-field"><span>Cupos</span><input type="number" name="capacity" [(ngModel)]="nuevoCurso.capacity" min="0"></label>
          <label class="form-field"><span>Horas</span><input type="number" name="duration" [(ngModel)]="nuevoCurso.durationHours" min="1"></label>
          <label class="form-field"><span>Inicio</span><input type="date" name="startDate" [(ngModel)]="nuevoCurso.startDate"></label>
        </div>
        <button class="btn-primary" (click)="crearCurso()">Guardar curso</button>
      </div>
      <div class="table-card"><div class="table-heading"><h2>Cursos registrados</h2><button class="btn-outline" (click)="cargarCursos()">Actualizar</button></div><div class="table-scroll"><table><thead><tr><th>Curso</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      @for(c of cursosVisibles();track c.id){<tr><td><strong>{{c.name}}</strong><small>{{c.code}}</small></td><td>S/ {{c.price|number:'1.2-2'}}</td><td><span class="status-pill">{{c.status}}</span></td><td><a class="table-link" [routerLink]="['/gestion/cursos',c.id]">Editar curso, horarios y sedes</a>@if(c.status==='PUBLISHED'){<a class="table-link" [routerLink]="['/curso',c.id]">Ver como estudiante</a>}</td></tr>}
      </tbody></table></div></div>
      @if(cursoEditando();as c){<div class="form-card"><h2>Editar: {{c.name}}</h2><p>La API actual expone operaciones PATCH separadas para nombre, descripción y precio.</p>
        <div class="form-grid">
          <label class="form-field"><span>Nuevo nombre</span><input name="editName" [(ngModel)]="editarNombre"></label>
          <label class="form-field"><span>Nuevo precio</span><input type="number" name="editPrice" [(ngModel)]="editarPrecio"></label>
          <label class="form-field wide"><span>Nueva descripción</span><textarea name="editDescription" [(ngModel)]="editarDescripcion" rows="3"></textarea></label>
        </div><div class="button-row"><button class="btn-primary" (click)="guardarCurso()">Guardar campos</button><button class="btn-outline" (click)="cambiarEstadoCurso(c,'publish')">Publicar</button><button class="btn-outline" (click)="cambiarEstadoCurso(c,'cancel')">Cancelar curso</button><button class="btn-outline" (click)="cambiarEstadoCurso(c,'complete')">Completar curso</button></div>
      </div>}
    }
    @if(vista==='categorias'){
      <div class="form-card compact-form"><h2>Nueva categoría</h2><div class="form-grid"><label class="form-field"><span>Nombre *</span><input name="catName" [(ngModel)]="nuevaCategoria.name"></label><label class="form-field"><span>Descripción</span><input name="catDescription" [(ngModel)]="nuevaCategoria.description"></label></div><button class="btn-primary" (click)="crearCategoria()">Crear categoría</button></div>
      <div class="table-card"><div class="table-heading"><h2>Categorías</h2><button class="btn-outline" (click)="cargarCategorias()">Actualizar</button></div><div class="table-scroll"><table><thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      @for(c of categoriasVisibles();track c.id){<tr><td><strong>{{c.name}}</strong></td><td>{{c.description||'—'}}</td><td>{{c.status}}</td><td><button class="table-link" (click)="seleccionarCategoria(c)">Editar</button><button class="table-link" (click)="alternarCategoria(c)">{{c.status==='ACTIVE'?'Desactivar':'Activar'}}</button></td></tr>}
      </tbody></table></div></div>
      @if(categoriaEditando();as c){<div class="form-card compact-form"><h2>Editar: {{c.name}}</h2><div class="form-grid"><label class="form-field"><span>Nombre</span><input name="renameCategory" [(ngModel)]="editarNombre"></label><label class="form-field"><span>Descripción</span><input name="recategory" [(ngModel)]="editarDescripcion"></label></div><button class="btn-primary" (click)="guardarCategoria()">Guardar cambios</button></div>}
    }
    @if(vista==='horarios'||vista==='sedes'){
      <div class="form-card">
        <h2>{{vista==='horarios'?'Administración de horarios':'Administración de sedes'}}</h2>
        <label class="form-field"><span>Selecciona un curso</span><select name="cursoRef" [ngModel]="cursoSeleccionado()" (ngModelChange)="seleccionarCursoReferencia($event)"><option value="">Elegir curso</option>@for(c of cursosVisibles();track c.id){<option [value]="c.id">{{c.name}}</option>}</select></label>
        @if(vista==='horarios'){
          <div class="form-grid">
            <label class="form-field"><span>Día</span><select name="day" [(ngModel)]="nuevoHorario.dayOfWeek">@for(d of dias;track d){<option [value]="d">{{d}}</option>}</select></label>
            <label class="form-field"><span>Aula / sala</span><input name="room" [(ngModel)]="nuevoHorario.room"></label>
            <label class="form-field"><span>Desde</span><input type="time" name="from" [(ngModel)]="nuevoHorario.startTime"></label>
            <label class="form-field"><span>Hasta</span><input type="time" name="to" [(ngModel)]="nuevoHorario.endTime"></label>
          </div><button class="btn-primary" (click)="crearHorario()">Crear horario</button>
          <div class="table-scroll"><table><thead><tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Aula</th><th>Edición</th></tr></thead><tbody>
          @for(h of horarios();track h.id){<tr><td>{{h.dayOfWeek}}</td><td>{{h.startTime}}</td><td>{{h.endTime}}</td><td>{{h.room||'—'}}</td><td><button class="table-link" (click)="editarRegistroHorario(h)">Editar</button></td></tr>}
          @if(horarios().length===0){<tr><td colspan="5" class="table-empty">Sin horarios para el curso seleccionado.</td></tr>}
          </tbody></table></div>
          @if (horarioEditando(); as h) {
            <div class="form-card editor-inline">
              <h3>Editar horario de {{ h.courseId }}</h3>
              <div class="form-grid">
                <label class="form-field"><span>Día</span><select [(ngModel)]="edicionHorario.dayOfWeek" name="editDay">@for(d of dias;track d){<option [value]="d">{{d}}</option>}</select></label>
                <label class="form-field"><span>Aula</span><input [(ngModel)]="edicionHorario.room" name="editRoom"></label>
                <label class="form-field"><span>Hora de inicio</span><input type="time" [(ngModel)]="edicionHorario.startTime" name="editStart"></label>
                <label class="form-field"><span>Hora de fin</span><input type="time" [(ngModel)]="edicionHorario.endTime" name="editEnd"></label>
              </div>
              <button class="btn-primary" (click)="guardarHorario()">Guardar horario</button>
              <button class="btn-outline" (click)="horarioEditando.set(null)">Cancelar</button>
            </div>
          }
        } @else {
          <div class="form-grid">
            <label class="form-field"><span>Nombre de la sede</span><input name="sedeName" [(ngModel)]="nuevaSede.name"></label>
            <label class="form-field"><span>Ciudad</span><input name="ciudad" [(ngModel)]="nuevaSede.city"></label>
            <label class="form-field"><span>Dirección</span><input name="direccion" [(ngModel)]="nuevaSede.address"></label>
            <label class="form-field"><span>Referencia</span><input name="referencia" [(ngModel)]="nuevaSede.reference"></label>
            <label class="form-field"><span>Capacidad</span><input type="number" name="sedeCapacity" [(ngModel)]="nuevaSede.capacity"></label>
          </div><button class="btn-primary" (click)="crearSede()">Crear sede</button>
          <div class="table-scroll"><table><thead><tr><th>Sede</th><th>Ciudad</th><th>Dirección</th><th>Capacidad</th><th>Edición</th></tr></thead><tbody>
          @for(s of sedes();track s.id){<tr><td>{{s.name}}</td><td>{{s.city||'—'}}</td><td>{{s.address||'—'}}</td><td>{{s.capacity??'—'}}</td><td><button class="table-link" (click)="editarRegistroSede(s)">Editar</button></td></tr>}
          @if(sedes().length===0){<tr><td colspan="5" class="table-empty">Sin sedes para el curso seleccionado.</td></tr>}
          </tbody></table></div>
          @if (sedeEditando(); as s) {
            <div class="form-card editor-inline">
              <h3>Editar sede: {{ s.name }}</h3>
              <div class="form-grid">
                <label class="form-field"><span>Nombre</span><input name="editSedeName" [(ngModel)]="edicionSede.name"></label>
                <label class="form-field"><span>Ciudad</span><input name="editSedeCity" [(ngModel)]="edicionSede.city"></label>
                <label class="form-field"><span>Dirección</span><input name="editSedeAddress" [(ngModel)]="edicionSede.address"></label>
                <label class="form-field"><span>Referencia</span><input name="editSedeReference" [(ngModel)]="edicionSede.reference"></label>
                <label class="form-field"><span>Capacidad</span><input type="number" name="editSedeCapacity" [(ngModel)]="edicionSede.capacity"></label>
              </div>
              <button class="btn-primary" (click)="guardarSede()">Guardar sede</button>
              <button class="btn-outline" (click)="sedeEditando.set(null)">Cancelar</button>
            </div>
          }
        }
      </div>
    }
    @if(vista==='integraciones'){
      <div class="form-card"><h2>Conexiones y servicios</h2><p>Elige un origen explícito. Si la API falla, no se muestran datos ficticios como respuestas reales.</p>
      <div class="mode-toggle"><button [class.selected]="demo.modo()==='demo'" (click)="cambiarModo('demo')">Modo demostración</button><button [class.selected]="demo.modo()==='api'" (click)="cambiarModo('api')">API real</button></div>
      <p class="mode-note">En desarrollo, Angular envía /api/v1 a catálogo y /api/pagos a pagos mediante el proxy. Matrículas continúa en modo demostración hasta tener endpoints.</p>
      <button class="btn-primary" (click)="diagnosticar()">Probar conexiones</button>
      <div class="diagnostics-grid">
        @for(d of diagnosticos();track d.nombre){<div class="diagnostic-card"><strong>{{d.nombre}}</strong><span [class.online]="d.estado==='online'" [class.offline]="d.estado==='offline'">{{d.estado==='online'?'● Disponible':'● Sin conexión'}}</span><p>{{d.detalle}}</p></div>}
      </div></div>
    }
  </section>
  `
})
export class AcademiaPanel implements OnInit {
  readonly demo=inject(AcademiaDemoService);
  private api=inject(AcademiaApiService);
  private route=inject(ActivatedRoute);
  private router=inject(Router);
  private platformId=inject(PLATFORM_ID);
  private destroyRef=inject(DestroyRef);
  readonly vista: string=this.route.snapshot.data['vista']||'matriculas';
  readonly error=signal(''); readonly mensaje=signal(''); readonly cargando=signal(false);
  readonly cursosApi=signal<Curso[]>([]); readonly categoriasApi=signal<Categoria[]>([]);
  readonly matriculasApi=signal<Matricula[]>([]);
  readonly pagosApi=signal<Pago[]>([]); readonly horarios=signal<Horario[]>([]); readonly sedes=signal<Sede[]>([]);
  readonly cursoActual=signal<Curso|null>(null); readonly cursoEditando=signal<Curso|null>(null);
  readonly categoriaEditando=signal<Categoria|null>(null); readonly cursoSeleccionado=signal('');
  readonly diagnosticos=signal<DiagnosticoApi[]>([]);
  readonly dias=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  readonly formMatricula={nombre:'',correo:'',telefono:'',tipoDocumento:'DNI',documento:''};
  montoPago=100;
  nuevoCurso:{code:string;name:string;description:string;categoryId:string;modality:'ONLINE'|'IN_PERSON'|'HYBRID';price:number;capacity:number;durationHours:number;startDate:string}=
    {code:'',name:'',description:'',categoryId:'',modality:'ONLINE',price:0,capacity:30,durationHours:20,startDate:''};
  nuevaCategoria={name:'',description:''};
  nuevoHorario={dayOfWeek:'MONDAY',startTime:'09:00',endTime:'11:00',room:''};
  nuevaSede={name:'',address:'',city:'',reference:'',capacity:30};
  readonly horarioEditando=signal<Horario|null>(null);
  readonly sedeEditando=signal<Sede|null>(null);
  edicionHorario={dayOfWeek:'MONDAY',startTime:'09:00',endTime:'11:00',room:''};
  edicionSede={name:'',address:'',city:'',reference:'',capacity:30};
  editarNombre='';editarDescripcion='';editarPrecio=0;
  cursosVisibles():Curso[]{return this.demo.modo()==='demo'?this.demo.cursos():this.cursosApi();}
  categoriasVisibles():Categoria[]{return this.demo.modo()==='demo'?this.demo.categorias():this.categoriasApi();}
  matriculasVisibles():Matricula[]{return this.demo.modo()==='demo'?this.demo.matriculas():this.matriculasApi();}
  pagosVisibles():Pago[]{return this.demo.modo()==='demo'?this.demo.pagos():this.pagosApi();}
  titulo():string{return ({matricula:'Formaliza tu matrícula',confirmacion:'Confirmación',matriculas:'Mis matrículas',estudiantes:'Estudiantes',pagos:'Gestión de pagos',cursos:'Administrar cursos',categorias:'Categorías',horarios:'Horarios',sedes:'Sedes',integraciones:'Conexiones API'} as Record<string,string>)[this.vista]||'Mi espacio';}
  subtitulo():string{return this.vista==='integraciones'?'Verifica el estado de los microservicios y cambia el origen de datos.':'Gestiona tus cursos y operaciones desde una única plataforma.';}
  ngOnInit():void {
    if(this.vista==='matricula'){
      const id=this.route.snapshot.paramMap.get('idCurso')||'';
      if(this.demo.modo()==='demo')this.cursoActual.set(this.demo.cursos().find(c=>c.id===id)||null);
      else this.api.curso(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:c=>this.cursoActual.set(c),error:()=>this.error.set('No se pudo recuperar el curso.')});
    }
    if(['cursos','horarios','sedes'].includes(this.vista))this.cargarCursos();
    if(['cursos','categorias'].includes(this.vista))this.cargarCategorias();
    if(this.vista==='pagos')this.cargarPagos();
    if(['matriculas','estudiantes'].includes(this.vista))this.cargarMatriculas();
  }
  private fallo(err:unknown):void {
    const message=typeof err==='object'&&err!==null&&'status' in err ? ' (HTTP '+String((err as {status:unknown}).status)+')':'';
    this.error.set('No se pudo completar la operación'+message+'. Comprueba el servicio y el proxy.');
  }
  private ok(msg:string):void{this.mensaje.set(msg);this.error.set('');}
  cargarCursos():void{
    if(this.demo.modo()==='demo')return;
    this.api.buscarCriterios({},0,100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:p=>this.cursosApi.set(p.content),error:e=>this.fallo(e)
    });
  }
  cargarCategorias():void{
    if(this.demo.modo()==='demo')return;
    this.api.todasCategorias(0,100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.categoriasApi.set(p.content),error:e=>this.fallo(e)});
  }
  registrarMatricula():void {
    const c=this.cursoActual(),f=this.formMatricula;
    if(!c||f.nombre.trim().length<3||!/^\S+@\S+\.\S+$/.test(f.correo)||!f.documento.trim()){
      this.error.set('Completa el nombre, correo válido y documento.');return;
    }
    if(f.tipoDocumento==='DNI'&&!/^\d{8}$/.test(f.documento)){
      this.error.set('El DNI debe tener 8 dígitos.');return;
    }
    const m:Matricula={
      id:String(Date.now()),courseId:c.id,courseName:c.name,nombre:f.nombre.trim(),correo:f.correo.trim(),
      tipoDocumento:f.tipoDocumento,documento:f.documento.trim(),telefono:f.telefono.trim(),
      fecha:new Date().toISOString(),estado:'PENDIENTE',importe:c.price,origen:'DEMO'
    };
    if(this.demo.modo()==='demo'){
      this.demo.registrarMatricula(m);
      this.router.navigate(['/confirmacion']);
      return;
    }
    this.cargando.set(true);
    this.api.registrarMatricula({
      courseId:c.id,nombre:f.nombre.trim(),correo:f.correo.trim(),telefono:f.telefono.trim(),
      tipoDocumento:f.tipoDocumento,documento:f.documento.trim()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.cargando.set(false);this.router.navigate(['/confirmacion']);},
      error:e=>{this.cargando.set(false);this.fallo(e);}
    });
  }
  cargarMatriculas():void {
    if(this.demo.modo()==='demo') return;
    const req=this.vista==='estudiantes' ? this.api.listarMatriculasAdmin():this.api.listarMatriculas();
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:items=>this.matriculasApi.set(items),
      error:e=>this.fallo(e)
    });
  }
  exportarMatriculas():void {
    if(!isPlatformBrowser(this.platformId))return;
    const cols=['ID','Estudiante','Correo','Documento','Curso','Fecha','Estado','Importe'];
    const csv=[cols,...this.matriculasVisibles().map(m=>[m.id,m.nombre,m.correo,m.documento,m.courseName,m.fecha,m.estado,String(m.importe)])]
      .map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='matriculas-myacademy.csv';a.click();URL.revokeObjectURL(url);
  }
  cargarPagos():void{
    if(this.demo.modo()==='demo')return;
    this.api.listarPagos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:x=>this.pagosApi.set(x),error:e=>this.fallo(e)});
  }
  crearPago():void{
    if(!Number.isFinite(this.montoPago)||this.montoPago<=0){this.error.set('El monto debe ser mayor a cero.');return;}
    if(this.demo.modo()==='demo'){this.demo.registrarPago(this.montoPago);this.ok('Registro de pago de demostración creado.');return;}
    this.api.crearPago(this.montoPago).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Pago registrado en el servicio.');this.cargarPagos();},error:e=>this.fallo(e)});
  }
  cambiarPago(p:Pago,estado:Pago['estado']):void{
    if(!isPlatformBrowser(this.platformId)||!window.confirm('¿Cambiar estado del pago #'+p.id+' a '+estado+'?'))return;
    if(this.demo.modo()==='demo'){this.demo.actualizarPago(p.id,estado);this.ok('Estado de prueba actualizado.');return;}
    const req=estado==='PAGADO'?this.api.confirmarPago(p.id):this.api.cancelarPago(p.id);
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Estado actualizado por API.');this.cargarPagos();},error:e=>this.fallo(e)});
  }
  crearCurso():void{
    const f=this.nuevoCurso;
    if(!f.code.trim()||!f.name.trim()||!f.categoryId||f.price<0||f.capacity<0||f.durationHours<=0){this.error.set('Revisa código, nombre, categoría, precio, horas y capacidad.');return;}
    const body={
      code:f.code.trim(),name:f.name.trim(),description:f.description,categoryId:f.categoryId,
      modality:f.modality,price:f.price,currency:'PEN',capacity:f.capacity,durationHours:f.durationHours,
      startDate:f.startDate||null,endDate:null,startTime:null,status:'DRAFT'
    };
    if(this.demo.modo()==='demo'){
      const cat=this.categoriasVisibles().find(c=>c.id===f.categoryId);
      const c:Curso={...body,id:crypto.randomUUID(),availableSlots:f.capacity,status:'DRAFT',categories:cat?[cat]:[]};
      this.demo.registrarCurso(c);this.ok('Curso demo creado.');return;
    }
    this.api.crearCurso(body).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Curso creado en backend.');this.cargarCursos();},error:e=>this.fallo(e)});
  }
  seleccionarCurso(c:Curso):void{this.cursoEditando.set(c);this.editarNombre=c.name;this.editarDescripcion=c.description||'';this.editarPrecio=c.price;}
  guardarCurso():void{
    const c=this.cursoEditando();if(!c||!this.editarNombre.trim()||this.editarPrecio<0){this.error.set('Revisa el nombre y el precio.');return;}
    if(this.demo.modo()==='demo'){
      this.demo.actualizarCurso(c.id,{name:this.editarNombre,description:this.editarDescripcion,price:this.editarPrecio});
      this.ok('Curso demo actualizado.');this.cursoEditando.set(null);return;
    }
    const cambios=[
      ...(this.editarNombre!==c.name?[this.api.cambiarNombreCurso(c.id,this.editarNombre)]:[]),
      ...(this.editarDescripcion!==(c.description||'')?[this.api.cambiarDescripcionCurso(c.id,this.editarDescripcion)]:[]),
      ...(this.editarPrecio!==c.price?[this.api.cambiarPrecioCurso(c.id,this.editarPrecio)]:[])
    ];
    if(cambios.length===0){this.ok('No hay cambios para guardar.');return;}
    // Los comandos modifican la misma entidad: se procesan uno a uno.
    from(cambios).pipe(concatMap(req=>req),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.ok('Curso actualizado.');this.cargarCursos();this.cursoEditando.set(null);},
      error:e=>this.fallo(e)
    });
  }
  cambiarEstadoCurso(c:Curso, accion:'publish'|'cancel'|'complete'):void{
    const estado=accion==='publish'?'PUBLISHED':accion==='cancel'?'CANCELLED':'COMPLETED';
    if(this.demo.modo()==='demo'){this.demo.actualizarCurso(c.id,{status:estado});this.ok('Estado demo actualizado.');this.cursoEditando.set(null);return;}
    const req=accion==='publish'?this.api.publicarCurso(c.id):accion==='cancel'?this.api.cancelarCurso(c.id):this.api.completarCurso(c.id);
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Estado actualizado.');this.cargarCursos();this.cursoEditando.set(null);},error:e=>this.fallo(e)});
  }
  crearCategoria():void{
    if(this.nuevaCategoria.name.trim().length<2){this.error.set('Escribe un nombre de categoría.');return;}
    const c:Categoria={id:crypto.randomUUID(),name:this.nuevaCategoria.name.trim(),description:this.nuevaCategoria.description,status:'ACTIVE'};
    if(this.demo.modo()==='demo'){this.demo.registrarCategoria(c);this.ok('Categoría demo creada.');return;}
    this.api.crearCategoria({name:c.name,description:c.description,status:'ACTIVE'}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Categoría creada.');this.cargarCategorias();},error:e=>this.fallo(e)});
  }
  seleccionarCategoria(c:Categoria):void{this.categoriaEditando.set(c);this.editarNombre=c.name;this.editarDescripcion=c.description||'';}
  guardarCategoria():void{
    const c=this.categoriaEditando();if(!c||!this.editarNombre.trim()){this.error.set('Nombre requerido.');return;}
    if(this.demo.modo()==='demo'){this.demo.actualizarCategoria(c.id,{name:this.editarNombre,description:this.editarDescripcion});this.ok('Categoría demo actualizada.');this.categoriaEditando.set(null);return;}
    const reqs=[...(c.name!==this.editarNombre?[this.api.renombrarCategoria(c.id,this.editarNombre)]:[]),
      ...((c.description||'')!==this.editarDescripcion?[this.api.descripcionCategoria(c.id,this.editarDescripcion)]:[])];
    if(reqs.length===0){this.ok('Sin cambios.');return;}
    from(reqs).pipe(concatMap(req=>req),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.ok('Categoría actualizada.');this.cargarCategorias();this.categoriaEditando.set(null);},
      error:e=>this.fallo(e)
    });
  }
  alternarCategoria(c:Categoria):void{
    if(this.demo.modo()==='demo'){this.demo.actualizarCategoria(c.id,{status:c.status==='ACTIVE'?'INACTIVE':'ACTIVE'});this.ok('Categoría demo actualizada.');return;}
    const req=c.status==='ACTIVE'?this.api.desactivarCategoria(c.id):this.api.activarCategoria(c.id);
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Estado actualizado.');this.cargarCategorias();},error:e=>this.fallo(e)});
  }
  seleccionarCursoReferencia(id:string):void{
    this.cursoSeleccionado.set(id);this.horarios.set([]);this.sedes.set([]);
    if(!id||this.demo.modo()==='demo')return;
    if(this.vista==='horarios')this.api.horarios(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.horarios.set(p.content),error:e=>this.fallo(e)});
    if(this.vista==='sedes')this.api.sedes(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.sedes.set(p.content),error:e=>this.fallo(e)});
  }
  crearHorario():void{
    const id=this.cursoSeleccionado();const h=this.nuevoHorario;
    if(!id||h.endTime<=h.startTime){this.error.set('Selecciona un curso y un horario válido.');return;}
    if(this.demo.modo()==='demo'){
      this.horarios.update(x=>[...x,{id:crypto.randomUUID(),courseId:id,...h}]);this.ok('Horario creado solo para esta sesión demo.');return;
    }
    this.api.crearHorario({courseId:id,...h}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Horario creado.');this.seleccionarCursoReferencia(id);},error:e=>this.fallo(e)});
  }
  crearSede():void{
    const id=this.cursoSeleccionado(),s=this.nuevaSede;
    if(!id||!s.name.trim()||s.capacity<0){this.error.set('Selecciona curso, sede y capacidad válida.');return;}
    if(this.demo.modo()==='demo'){
      this.sedes.update(x=>[...x,{id:crypto.randomUUID(),courseId:id,...s}]);this.ok('Sede creada solo para esta sesión demo.');return;
    }
    this.api.crearSede({courseId:id,...s}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.ok('Sede creada.');this.seleccionarCursoReferencia(id);},error:e=>this.fallo(e)});
  }
  editarRegistroHorario(h:Horario):void {
    this.horarioEditando.set(h);
    this.edicionHorario={dayOfWeek:h.dayOfWeek,startTime:h.startTime.substring(0,5),
      endTime:h.endTime.substring(0,5),room:h.room||''};
  }
  guardarHorario():void {
    const h=this.horarioEditando(),e=this.edicionHorario;
    if(!h)return;
    if(e.endTime<=e.startTime){this.error.set('La hora de fin debe ser posterior al inicio.');return;}
    if(this.demo.modo()==='demo'){
      this.horarios.update(items=>items.map(x=>x.id===h.id?{...x,...e}:x));
      this.ok('Horario demo actualizado durante esta sesión.');this.horarioEditando.set(null);return;
    }
    const reqs=[
      ...(h.dayOfWeek!==e.dayOfWeek?[this.api.editarHorario(h.id,'day',e.dayOfWeek)]:[]),
      ...(h.startTime.substring(0,5)!==e.startTime?[this.api.editarHorario(h.id,'start-time',e.startTime)]:[]),
      ...(h.endTime.substring(0,5)!==e.endTime?[this.api.editarHorario(h.id,'end-time',e.endTime)]:[]),
      ...((h.room||'')!==e.room?[this.api.editarHorario(h.id,'room',e.room)]:[])
    ];
    if(!reqs.length){this.ok('No hay cambios.');return;}
    from(reqs).pipe(concatMap(req=>req),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.ok('Horario actualizado.');this.horarioEditando.set(null);this.seleccionarCursoReferencia(h.courseId);},
      error:err=>this.fallo(err)
    });
  }
  editarRegistroSede(s:Sede):void {
    this.sedeEditando.set(s);
    this.edicionSede={name:s.name,address:s.address||'',city:s.city||'',
      reference:s.reference||'',capacity:s.capacity??0};
  }
  guardarSede():void {
    const s=this.sedeEditando(),e=this.edicionSede;if(!s)return;
    if(!e.name.trim()||e.capacity<0){this.error.set('El nombre es obligatorio y la capacidad no puede ser negativa.');return;}
    if(this.demo.modo()==='demo'){
      this.sedes.update(items=>items.map(x=>x.id===s.id?{...x,...e}:x));
      this.ok('Sede demo actualizada durante esta sesión.');this.sedeEditando.set(null);return;
    }
    const reqs=[
      ...(s.name!==e.name?[this.api.editarSede(s.id,'name',e.name)]:[]),
      ...((s.address||'')!==e.address?[this.api.editarSede(s.id,'address',e.address)]:[]),
      ...((s.city||'')!==e.city?[this.api.editarSede(s.id,'city',e.city)]:[]),
      ...((s.reference||'')!==e.reference?[this.api.editarSede(s.id,'reference',e.reference)]:[]),
      ...((s.capacity??0)!==e.capacity?[this.api.editarSede(s.id,'capacity',e.capacity)]:[])
    ];
    if(!reqs.length){this.ok('No hay cambios.');return;}
    from(reqs).pipe(concatMap(req=>req),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.ok('Sede actualizada.');this.sedeEditando.set(null);this.seleccionarCursoReferencia(s.courseId);},
      error:err=>this.fallo(err)
    });
  }
  cambiarModo(modo:'demo'|'api'):void{this.demo.establecerModo(modo);this.ok('Modo '+modo.toUpperCase()+' seleccionado. Se aplicará al navegar a otras vistas.');}
  diagnosticar():void{
    this.diagnosticos.set([]);this.cargando.set(true);
    let faltan=2;
    const cerrar=()=>{if(--faltan===0)this.cargando.set(false);};
    this.api.cursosPublicados(0,1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:p=>{this.diagnosticos.update(x=>[...x,{nombre:'Catálogo',estado:'online',detalle:'API respondió; '+p.totalElements+' cursos publicados.'}]);cerrar();},
      error:e=>{this.diagnosticos.update(x=>[...x,{nombre:'Catálogo',estado:'offline',detalle:'No responde /api/v1/courses/published (HTTP '+String(e.status||0)+')'}]);cerrar();}
    });
    this.api.listarPagos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:p=>{this.diagnosticos.update(x=>[...x,{nombre:'Pagos',estado:'online',detalle:p.length+' registros.'}]);cerrar();},
      error:e=>{this.diagnosticos.update(x=>[...x,{nombre:'Pagos',estado:'offline',detalle:'No responde /api/pagos (HTTP '+String(e.status||0)+')'}]);cerrar();}
    });
  }
}
