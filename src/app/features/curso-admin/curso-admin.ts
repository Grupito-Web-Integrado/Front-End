import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { from, concatMap, toArray } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademiaApiService } from '../../core/academia-api.service';
import { AcademiaDemoService } from '../../core/academia-demo.service';
import { Categoria, Curso, Horario, Sede } from '../../core/academia.models';

@Component({
  selector: 'app-curso-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <section class="shell workspace-section course-editor">
    <div class="detail-breadcrumb"><a routerLink="/gestion/cursos">Gestión de cursos</a> / Editar curso</div>
    @if (cargando()) { <div class="empty-state">Consultando curso y relaciones…</div> }
    @if (error()) { <div class="error-banner" role="alert">{{ error() }}</div> }
    @if (mensaje()) { <div class="success-banner" role="status">{{ mensaje() }}</div> }
    @if (curso(); as c) {
      <div class="workspace-heading">
        <div><span class="section-overline">ADMINISTRACIÓN · {{ demo.modo()==='demo'?'DEMOSTRACIÓN':'API REAL' }}</span>
          <h1>{{ c.name }}</h1>
          <p>Código {{ c.code }} · <span class="status-pill">{{ c.status }}</span></p>
        </div>
        <div class="button-row">
          @if(c.status==='PUBLISHED'){<a class="btn-outline" [routerLink]="['/curso',c.id]">Vista del estudiante ↗</a>}
          <a class="btn-outline" routerLink="/gestion/cursos">Volver a cursos</a>
        </div>
      </div>
      <div class="editor-columns">
        <div>
          <div class="form-card">
            <h2>Datos del curso</h2>
            <p>Los cambios de nombre, descripción y precio se envían a los endpoints PATCH del curso. El backend solo acepta una categoría al crear el curso.</p>
            <div class="form-grid">
              <label class="form-field"><span>Nombre</span><input name="name" [(ngModel)]="edicion.name"></label>
              <label class="form-field"><span>Precio (S/)</span><input type="number" min="0" step="0.01" name="price" [(ngModel)]="edicion.price"></label>
              <label class="form-field wide"><span>Descripción</span><textarea name="description" rows="3" [(ngModel)]="edicion.description"></textarea></label>
              <label class="form-field"><span>Modalidad</span><input [value]="modalidadTexto(c.modality)" readonly></label>
              <label class="form-field"><span>Categoría del curso</span>
                <select name="category" [disabled]="demo.modo()==='api'" [(ngModel)]="edicion.categoryId">
                  @for(cat of categorias();track cat.id){<option [value]="cat.id">{{cat.name}}</option>}
                </select>
              </label>
            </div>
            @if(demo.modo()==='api'){<p class="mode-note">Para reasignar la categoría o cambiar la modalidad de un curso existente falta un endpoint PATCH en el backend. Estas opciones permanecen bloqueadas en modo API.</p>}
            <button class="btn-primary" (click)="guardarDatos()">Guardar modificaciones</button>
          </div>
          <div class="form-card" id="horarios-curso">
            <h2>Horarios de este curso</h2>
            <p>Cada horario está asociado al ID de este curso.</p>
            <div class="form-grid">
              <label class="form-field"><span>Día</span><select name="day" [(ngModel)]="formHorario.dayOfWeek">@for(d of dias;track d){<option [value]="d">{{diaTexto(d)}}</option>}</select></label>
              <label class="form-field"><span>Sala</span><input name="room" [(ngModel)]="formHorario.room"></label>
              <label class="form-field"><span>Desde</span><input type="time" name="start" [(ngModel)]="formHorario.startTime"></label>
              <label class="form-field"><span>Hasta</span><input type="time" name="end" [(ngModel)]="formHorario.endTime"></label>
            </div>
            <div class="button-row">
              <button class="btn-primary" (click)="guardarHorario()">{{horarioEditando()?'Guardar cambios':'Agregar horario'}}</button>
              @if(horarioEditando()){<button class="btn-outline" (click)="cancelarHorario()">Cancelar edición</button>}
            </div>
            <div class="table-scroll"><table><thead><tr><th>Día</th><th>Horas</th><th>Sala</th><th></th></tr></thead><tbody>
            @for(h of horarios();track h.id){<tr><td>{{diaTexto(h.dayOfWeek)}}</td><td>{{h.startTime}} – {{h.endTime}}</td><td>{{h.room||'—'}}</td><td><button class="table-link" (click)="editarHorario(h)">Editar</button></td></tr>}
            @if(horarios().length===0){<tr><td colspan="4" class="table-empty">Aún no hay horarios asociados.</td></tr>}
            </tbody></table></div>
          </div>
          <div class="form-card" id="sedes-curso">
            <h2>Sedes de este curso</h2>
            <p>Las sedes pertenecen a este curso, no a un formulario de administración separado.</p>
            <div class="form-grid">
              <label class="form-field"><span>Nombre de sede</span><input name="locationName" [(ngModel)]="formSede.name"></label>
              <label class="form-field"><span>Ciudad</span><input name="city" [(ngModel)]="formSede.city"></label>
              <label class="form-field"><span>Dirección</span><input name="address" [(ngModel)]="formSede.address"></label>
              <label class="form-field"><span>Referencia</span><input name="reference" [(ngModel)]="formSede.reference"></label>
              <label class="form-field"><span>Capacidad</span><input type="number" min="0" name="capacity" [(ngModel)]="formSede.capacity"></label>
            </div>
            <div class="button-row">
              <button class="btn-primary" (click)="guardarSede()">{{sedeEditando()?'Guardar cambios':'Agregar sede'}}</button>
              @if(sedeEditando()){<button class="btn-outline" (click)="cancelarSede()">Cancelar edición</button>}
            </div>
            <div class="table-scroll"><table><thead><tr><th>Nombre</th><th>Ciudad</th><th>Capacidad</th><th></th></tr></thead><tbody>
            @for(s of sedes();track s.id){<tr><td>{{s.name}}</td><td>{{s.city||'—'}}</td><td>{{s.capacity??'—'}}</td><td><button class="table-link" (click)="editarSede(s)">Editar</button></td></tr>}
            @if(sedes().length===0){<tr><td colspan="4" class="table-empty">No hay sedes registradas.</td></tr>}
            </tbody></table></div>
          </div>
        </div>
        <aside class="editor-sidebar">
          <div class="form-card">
            <h2>Imagen de portada</h2>
            <img class="editor-cover" [src]="edicion.imageUrl || '/course-covers/area-0.svg'" [alt]="'Portada de '+c.name">
            <label class="form-field"><span>URL de imagen (solo demostración)</span>
              <input name="imageUrl" [(ngModel)]="edicion.imageUrl" [disabled]="demo.modo()==='api'" placeholder="/course-covers/area-0.svg">
            </label>
            @if(demo.modo()==='demo'){
              <button class="btn-outline" (click)="guardarImagen()">Guardar portada demo</button>
            } @else {
              <p class="mode-note">La API de Catálogo aún no tiene campo de imagen ni endpoint para subir portadas.</p>
            }
          </div>
          <div class="form-card">
            <h2>Estado y publicación</h2>
            <p>Estados definidos por Java: DRAFT, PUBLISHED, CANCELLED y COMPLETED.</p>
            @if(c.status==='DRAFT') {
              <button class="btn-primary" (click)="cambiarEstado('publish')">Publicar curso</button>
            } @else if(c.status==='PUBLISHED') {
              <div class="button-row">
                <button class="btn-outline" (click)="cambiarEstado('complete')">Completar</button>
                <button class="btn-outline" (click)="cambiarEstado('cancel')">Cancelar</button>
              </div>
            } @else {
              <p class="mode-note">Este estado no dispone de transición de recuperación en los endpoints actuales.</p>
            }
          </div>
        </aside>
      </div>
    } @else if (!cargando() && !error()) {
      <div class="empty-state">Curso no encontrado. <a routerLink="/gestion/cursos">Volver a la lista</a></div>
    }
  </section>
  `
})
export class CursoAdmin implements OnInit {
  readonly demo=inject(AcademiaDemoService);
  private readonly api=inject(AcademiaApiService);
  private readonly route=inject(ActivatedRoute);
  private readonly destroyRef=inject(DestroyRef);
  readonly curso=signal<Curso|null>(null);
  readonly horarios=signal<Horario[]>([]);
  readonly sedes=signal<Sede[]>([]);
  readonly categorias=signal<Categoria[]>([]);
  readonly cargando=signal(false);
  readonly error=signal('');
  readonly mensaje=signal('');
  readonly horarioEditando=signal<Horario|null>(null);
  readonly sedeEditando=signal<Sede|null>(null);
  readonly dias=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  private readonly id=this.route.snapshot.paramMap.get('id') || '';
  edicion={name:'',description:'',price:0,categoryId:'',imageUrl:''};
  formHorario={dayOfWeek:'MONDAY',startTime:'09:00',endTime:'11:00',room:''};
  formSede={name:'',address:'',city:'',reference:'',capacity:30};

  ngOnInit():void { this.cargar(); }
  modalidadTexto(x:Curso['modality']):string {return x==='IN_PERSON'?'Presencial':x==='HYBRID'?'Híbrida':'Online';}
  diaTexto(x:string):string {
    const mapa:Record<string,string>={MONDAY:'Lunes',TUESDAY:'Martes',WEDNESDAY:'Miércoles',THURSDAY:'Jueves',FRIDAY:'Viernes',SATURDAY:'Sábado',SUNDAY:'Domingo'};
    return mapa[x]||x;
  }
  private errorApi(e:unknown):void{
    const status=e&&typeof e==='object'&&'status' in e ? String((e as {status:unknown}).status):'desconocido';
    this.error.set('No se pudo completar la petición (HTTP '+status+'). Comprueba la API y los permisos.');
  }
  private ok(text:string):void{this.error.set('');this.mensaje.set(text);}
  private asignar(c:Curso):void{
    this.curso.set(c);
    this.edicion={name:c.name,description:c.description||'',price:c.price,
      categoryId:c.categoryId || c.categories?.[0]?.id || '',imageUrl:c.imageUrl||''};
    this.horarios.set(c.schedules || []);
    this.sedes.set(c.locations || []);
    if(this.demo.modo()==='api')this.cargarRelaciones();
  }
  cargar():void{
    this.error.set('');this.cargando.set(true);
    if(this.demo.modo()==='demo'){
      const c=this.demo.cursos().find(x=>x.id===this.id);
      this.categorias.set(this.demo.categorias());
      if(c)this.asignar(c);else this.error.set('Curso no encontrado en la demostración.');
      this.cargando.set(false);return;
    }
    this.api.curso(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:c=>{this.asignar(c);this.cargando.set(false);},
      error:e=>{this.errorApi(e);this.cargando.set(false);}
    });
    this.api.categoriasActivasCompletas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:cats=>this.categorias.set(cats),error:()=>{}
    });
  }
  private cargarRelaciones():void{
    this.api.horarios(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.horarios.set(p.content),error:()=>{}});
    this.api.sedes(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.sedes.set(p.content),error:()=>{}});
  }
  private guardarRelacionesDemo(update:Partial<Curso>):void{
    this.demo.actualizarCurso(this.id,update);
    const c=this.demo.cursos().find(x=>x.id===this.id);if(c)this.curso.set(c);
  }
  guardarDatos():void{
    const c=this.curso(),v=this.edicion;if(!c)return;
    if(!v.name.trim()||!Number.isFinite(v.price)||v.price<0){this.error.set('El nombre y precio deben ser válidos.');return;}
    if(this.demo.modo()==='demo'){
      const cat=this.demo.categorias().find(x=>x.id===v.categoryId);
      this.guardarRelacionesDemo({name:v.name.trim(),description:v.description,price:v.price,
        categoryId:v.categoryId,categories:cat?[cat]:[]});
      this.ok('Datos demo guardados.');return;
    }
    const requests=[
      ...(v.name.trim()!==c.name?[this.api.cambiarNombreCurso(c.id,v.name.trim())]:[]),
      ...(v.description!==(c.description||'')?[this.api.cambiarDescripcionCurso(c.id,v.description)]:[]),
      ...(v.price!==c.price?[this.api.cambiarPrecioCurso(c.id,v.price)]:[])
    ];
    if(!requests.length){this.ok('No hay cambios.');return;}
    from(requests).pipe(concatMap(x=>x),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.ok('Datos guardados en el backend.');this.cargar();},
      error:e=>this.errorApi(e)
    });
  }
  guardarImagen():void{
    if(this.demo.modo()!=='demo')return;
    const url=this.edicion.imageUrl.trim();
    if(url && !url.startsWith('/course-covers/') && !/^https:\/\//.test(url)){
      this.error.set('Utiliza una ruta /course-covers/ o una URL HTTPS.');return;
    }
    this.guardarRelacionesDemo({imageUrl:url});
    this.ok('Portada demo guardada en este navegador.');
  }
  editarHorario(h:Horario):void{
    this.horarioEditando.set(h);
    this.formHorario={dayOfWeek:h.dayOfWeek,startTime:h.startTime.slice(0,5),endTime:h.endTime.slice(0,5),room:h.room||''};
  }
  cancelarHorario():void{
    this.horarioEditando.set(null);
    this.formHorario={dayOfWeek:'MONDAY',startTime:'09:00',endTime:'11:00',room:''};
  }
  guardarHorario():void{
    const h=this.horarioEditando(),v=this.formHorario;
    if(v.endTime<=v.startTime){this.error.set('La hora final debe ser posterior a la inicial.');return;}
    const nuevo={courseId:this.id,...v};
    if(this.demo.modo()==='demo'){
      const nuevoHorario:Horario=h?{...h,...nuevo}:{id:crypto.randomUUID(),...nuevo};
      const lista=h?this.horarios().map(x=>x.id===h.id?nuevoHorario:x):[...this.horarios(),nuevoHorario];
      this.horarios.set(lista);this.guardarRelacionesDemo({schedules:lista});this.cancelarHorario();
      this.ok('Horario demo guardado dentro del curso.');return;
    }
    if(!h){
      this.api.crearHorario(nuevo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next:()=>{this.cancelarHorario();this.cargarRelaciones();this.ok('Horario registrado en la API.');},
        error:e=>this.errorApi(e)});
      return;
    }
    const peticiones=[
      ...(v.dayOfWeek!==h.dayOfWeek?[this.api.editarHorario(h.id,'day',v.dayOfWeek)]:[]),
      ...(v.startTime!==h.startTime.slice(0,5)?[this.api.editarHorario(h.id,'start-time',v.startTime)]:[]),
      ...(v.endTime!==h.endTime.slice(0,5)?[this.api.editarHorario(h.id,'end-time',v.endTime)]:[]),
      ...(v.room!==(h.room||'')?[this.api.editarHorario(h.id,'room',v.room)]:[])
    ];
    if(!peticiones.length){this.ok('Sin cambios.');return;}
    from(peticiones).pipe(concatMap(x=>x),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.cancelarHorario();this.cargarRelaciones();this.ok('Horario actualizado en la API.');},
      error:e=>this.errorApi(e)
    });
  }
  editarSede(s:Sede):void{
    this.sedeEditando.set(s);
    this.formSede={name:s.name,city:s.city||'',address:s.address||'',reference:s.reference||'',capacity:s.capacity??0};
  }
  cancelarSede():void{
    this.sedeEditando.set(null);
    this.formSede={name:'',city:'',address:'',reference:'',capacity:30};
  }
  guardarSede():void{
    const s=this.sedeEditando(),v=this.formSede;
    if(!v.name.trim()||v.capacity<0){this.error.set('Nombre y capacidad de la sede no válidos.');return;}
    const nueva={courseId:this.id,...v};
    if(this.demo.modo()==='demo'){
      const sede:Sede=s?{...s,...nueva}:{id:crypto.randomUUID(),...nueva};
      const lista=s?this.sedes().map(x=>x.id===s.id?sede:x):[...this.sedes(),sede];
      this.sedes.set(lista);this.guardarRelacionesDemo({locations:lista});this.cancelarSede();
      this.ok('Sede demo guardada dentro del curso.');return;
    }
    if(!s){
      this.api.crearSede(nueva).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next:()=>{this.cancelarSede();this.cargarRelaciones();this.ok('Sede registrada en la API.');},
        error:e=>this.errorApi(e)});
      return;
    }
    const peticiones=[
      ...(v.name!==s.name?[this.api.editarSede(s.id,'name',v.name)]:[]),
      ...(v.address!==(s.address||'')?[this.api.editarSede(s.id,'address',v.address)]:[]),
      ...(v.city!==(s.city||'')?[this.api.editarSede(s.id,'city',v.city)]:[]),
      ...(v.reference!==(s.reference||'')?[this.api.editarSede(s.id,'reference',v.reference)]:[]),
      ...(v.capacity!==(s.capacity??0)?[this.api.editarSede(s.id,'capacity',v.capacity)]:[])
    ];
    if(!peticiones.length){this.ok('Sin cambios.');return;}
    from(peticiones).pipe(concatMap(x=>x),toArray(),takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.cancelarSede();this.cargarRelaciones();this.ok('Sede actualizada en la API.');},
      error:e=>this.errorApi(e)
    });
  }
  cambiarEstado(accion:'publish'|'cancel'|'complete'):void{
    const c=this.curso();if(!c)return;
    const destino=accion==='publish'?'PUBLISHED':accion==='cancel'?'CANCELLED':'COMPLETED';
    if(this.demo.modo()==='demo'){this.guardarRelacionesDemo({status:destino});this.ok('Estado demo actualizado.');return;}
    const op=accion==='publish'?this.api.publicarCurso(c.id):
      accion==='cancel'?this.api.cancelarCurso(c.id):this.api.completarCurso(c.id);
    op.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:()=>{this.ok('Estado actualizado en backend.');this.cargar();},
      error:e=>this.errorApi(e)
    });
  }
}
