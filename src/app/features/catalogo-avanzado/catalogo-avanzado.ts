import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, of, forkJoin, switchMap, debounceTime, distinctUntilChanged, catchError, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademiaApiService } from '../../core/academia-api.service';
import { AcademiaDemoService } from '../../core/academia-demo.service';
import { Categoria, Curso, Horario, Sede, Sugerencia } from '../../core/academia.models';
import { CursoCard } from '../curso-card/curso-card';
import { portadaCurso } from '../../core/course-cover';

@Component({
  selector: 'app-catalogo-avanzado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CursoCard],
  template: `
  @if (vista !== 'detalle') {
    <section class="hero-section">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"><span class="eyebrow-dot"></span> Aprende a tu ritmo · Formación que transforma</span>
          <h1>Tu próximo gran<br><em>logro empieza aquí.</em></h1>
          <p>Descubre programas prácticos en tecnología, diseño y negocios. Da el siguiente paso con habilidades que importan.</p>
          <div class="hero-search">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input type="search" aria-label="Buscar cursos" placeholder="¿Qué te gustaría aprender hoy?"
              [ngModel]="consulta()" (ngModelChange)="escribirBusqueda($event)"
              (keydown.enter)="ejecutarBusqueda()">
            <button class="btn-primary" (click)="ejecutarBusqueda()">Buscar cursos</button>
            @if (sugerencias().length > 0 && consulta().trim().length >= 2) {
              <div class="search-suggestions">
                @for (s of sugerencias(); track s.id) {
                  <a [routerLink]="['/curso', s.id]">{{ s.name }} <span>↗</span></a>
                }
              </div>
            }
          </div>
          <div class="hero-popular"><span>Popular ahora:</span>
            <button (click)="buscarRapido('Python')">Python</button>
            <button (click)="buscarRapido('Inteligencia artificial')">Inteligencia artificial</button>
            <button (click)="buscarRapido('Excel')">Excel</button>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="orb orb-one"></div><div class="orb orb-two"></div>
          <div class="hero-card hero-card-main"><span class="hero-card-kicker">MYACADEMY / LEARN</span><span class="hero-brackets">&lt; / &gt;</span><strong>Build your future.</strong></div>
          <div class="hero-card hero-card-float"><span>✦</span><div><strong>Aprende haciendo</strong><small>Proyectos reales</small></div></div>
          <div class="hero-star">✳</div>
        </div>
      </div>
    </section>
    <section class="stats-strip">
      <div class="shell stats-grid">
        <div><strong>{{ cantidadTotal() }}</strong><span>Cursos para explorar</span></div>
        <div><strong>{{ categorias().length }}</strong><span>Áreas de aprendizaje</span></div>
        <div><strong>3</strong><span>Modalidades disponibles</span></div>
        <div><strong>24/7</strong><span>Catálogo en línea</span></div>
      </div>
    </section>

    <section class="shell section-block" id="categorias">
      <div class="section-heading"><div><span class="section-overline">ENCUENTRA TU CAMINO</span><h2>Explora por categoría</h2><p>Una oportunidad para cada interés y objetivo.</p></div><a routerLink="/catalogo" class="text-link">Ver todos los cursos ↗</a></div>
      <div class="category-toolbar">
        <button class="btn-outline" [class.active]="categoriaSeleccionada()===''" (click)="elegirCategoria('')">Todas las categorías</button>
        @if (categorias().length > 6) {
          <button class="text-link" type="button" (click)="mostrarTodasCategorias.set(!mostrarTodasCategorias())">
            {{ mostrarTodasCategorias() ? 'Mostrar solo seis' : 'Ver las '+categorias().length+' categorías' }}
          </button>
        }
      </div>
      <div class="categories-grid">
        @for (cat of categoriasPrincipales(); track cat.id; let i = $index) {
          <button class="category-tile" [class.active]="categoriaSeleccionada()===cat.id" (click)="elegirCategoria(cat.id)">
            <span class="category-emoji">{{ iconoCategoria(i) }}</span><strong>{{ cat.name }}</strong><small>Explorar cursos</small>
          </button>
        }
      </div>
    </section>

    <section class="shell section-block" id="cursos">
      <div class="section-heading"><div><span class="section-overline">CURSOS PARA TI</span><h2>Encuentra lo que te apasiona</h2><p>Aprende con contenido claro, práctico y actualizado.</p></div>
        <span class="results-pill">{{ cursosFiltrados().length }} resultados</span>
      </div>
      <div class="filters-panel">
        <label class="filter-group"><span>Modalidad</span>
          <select [ngModel]="modalidad()" (ngModelChange)="cambiarModalidad($event)">
            <option value="">Todas las modalidades</option><option value="ONLINE">Online</option><option value="HYBRID">Híbrida</option><option value="IN_PERSON">Presencial</option>
          </select>
        </label>
        <label class="filter-group"><span>Precio máximo</span>
          <select [ngModel]="precioMax()" (ngModelChange)="cambiarPrecio(+$event)">
            <option [ngValue]="0">Cualquier precio</option><option [ngValue]="150">Hasta S/ 150</option><option [ngValue]="200">Hasta S/ 200</option><option [ngValue]="250">Hasta S/ 250</option>
          </select>
        </label>
        <label class="filter-group"><span>Ordenar por</span>
          <select [ngModel]="orden()" (ngModelChange)="cambiarOrden($event)">
            <option value="relevancia">Relevancia</option><option value="precio-asc">Menor precio</option><option value="precio-desc">Mayor precio</option><option value="nombre">Nombre A–Z</option>
          </select>
        </label>
        <label class="filter-check"><input type="checkbox" [ngModel]="soloCupos()" (ngModelChange)="cambiarCupos($event)"> Con cupos</label>
        <button class="clear-filters" (click)="limpiar()">Limpiar filtros</button>
      </div>
      @if (cargando()) { <div class="empty-state">Buscando cursos disponibles…</div> }
      @if (error()) { <div class="error-banner" role="alert">{{ error() }} <button class="table-link" type="button" (click)="cargarCursos()">Reintentar</button></div> }
      @if (errorCategorias()) { <p class="mode-note" role="alert">{{errorCategorias()}} <button class="table-link" type="button" (click)="cargarCategorias()">Reintentar categorías</button></p> }
      @if (avisoLimite()) { <p class="mode-note">{{avisoLimite()}}</p> }
      @if (!cargando()) {
        <div class="courses-grid">
          @for (curso of cursosVisibles(); track curso.id) {
            <app-curso-card [curso]="curso" [categoria]="nombreCategoria(curso)"/>
          } @empty {
            <div class="empty-state"><strong>{{error()?'No fue posible consultar el catálogo.':'No hay cursos publicados con estos filtros.'}}</strong><span>{{error()?'Comprueba la conexión del microservicio.':'Prueba otra búsqueda o cambia de categoría.'}}</span><button class="btn-outline" (click)="limpiar()">Mostrar todos</button></div>
          }
        </div>
        @if (totalPaginas()>1) {
          <div class="pagination"><button [disabled]="pagina()===0" (click)="cambiarPagina(-1)">Anterior</button><span>Página {{ pagina()+1 }} de {{ totalPaginas() }}</span><button [disabled]="pagina()+1>=totalPaginas()" (click)="cambiarPagina(1)">Siguiente</button></div>
        }
      }
    </section>
    <section class="shell cta-banner"><div><span class="section-overline">TU FUTURO COMIENZA HOY</span><h2>Un aprendizaje puede cambiarlo todo.</h2><p>Explora nuestros programas y encuentra el próximo paso en tu carrera.</p></div><a class="btn-light" routerLink="/catalogo">Ver catálogo completo ↗</a></section>
  } @else {
    <section class="shell detail-layout">
      <div class="detail-breadcrumb"><a routerLink="/inicio">Inicio</a> / <a routerLink="/catalogo">Cursos</a> / Detalle</div>
      @if (cargando()) { <div class="empty-state">Cargando información del curso…</div> }
      @if (error()) { <div class="error-banner">{{ error() }} <a routerLink="/catalogo">Volver al catálogo</a></div> }
      @if (detalle(); as curso) {
        <div class="detail-grid">
          <div class="detail-main">
            <span class="section-overline">{{ nombreCategoria(curso) }}</span>
            <h1>{{ curso.name }}</h1>
            <p class="detail-lead">{{ curso.description }}</p>
            <div class="detail-chips"><span>{{ curso.modality === 'ONLINE' ? 'Online' : curso.modality==='HYBRID'?'Híbrido':'Presencial' }}</span><span>{{ curso.durationHours || '—' }} horas</span><span>{{ curso.availableSlots }} cupos</span><span>{{ curso.code }}</span></div>
            <section class="detail-box"><h2>Sobre este curso</h2>
              <p>{{ curso.description || 'El equipo académico aún no ha publicado una descripción detallada.' }}</p>
              <div class="course-detail-facts">
                <div><span>Código del curso</span><strong>{{ curso.code }}</strong></div>
                <div><span>Duración</span><strong>{{ curso.durationHours || 'Por confirmar' }} horas</strong></div>
                @if(curso.startDate){<div><span>Fecha de inicio</span><strong>{{ curso.startDate | date:'mediumDate' }}</strong></div>}
                @if(curso.endDate){<div><span>Fecha de fin</span><strong>{{ curso.endDate | date:'mediumDate' }}</strong></div>}
                <div><span>Modalidad</span><strong>{{ curso.modality==='IN_PERSON'?'Presencial':curso.modality==='HYBRID'?'Híbrida':'Online' }}</strong></div>
              </div>
            </section>
            <section class="detail-box"><h2>Horarios del curso</h2>
              @for (h of horarios(); track h.id) { <p><strong>{{ diaTexto(h.dayOfWeek) }}</strong> · {{ h.startTime }} – {{ h.endTime }} · {{ h.room || 'Sala por confirmar' }}</p> }
              @if (horarios().length===0) { <p>El horario todavía no está registrado en el sistema.</p> }
            </section>
            <section class="detail-box"><h2>Sedes del curso</h2>
              @for (s of sedes(); track s.id) { <p><strong>{{ s.name }}</strong> · {{ s.city || '' }} · {{ s.address || '' }} @if(s.reference){· Referencia: {{ s.reference }}}</p> }
              @if (sedes().length===0) {
                <p>{{ curso.modality==='ONLINE'?'Este curso se imparte en línea.':'No hay sedes publicadas para este curso.' }}</p>
              }
            </section>
          </div>
          <aside class="detail-buy"><div class="detail-visual"><img [src]="portadaCurso(curso)" [alt]="'Portada ilustrativa del curso '+curso.name" loading="lazy"></div><div class="detail-price"><small>Inversión</small><strong>S/ {{ curso.price | number:'1.2-2' }}</strong></div><a class="btn-primary btn-block" [routerLink]="['/matricula',curso.id]">Matricularme ahora ↗</a><p>La matrícula requiere una cuenta de estudiante y disponibilidad del servicio.</p><a class="text-link" routerLink="/catalogo">← Seguir explorando</a></aside>
        </div>
      }
    </section>
  }
  `
})
export class CatalogoAvanzado implements OnInit {
  readonly demo = inject(AcademiaDemoService);
  readonly portadaCurso=portadaCurso;
  private api = inject(AcademiaApiService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  readonly vista = this.route.snapshot.data['vista'] === 'detalle' ? 'detalle' : 'catalogo';
  readonly consulta = signal('');
  readonly consultaAplicada = signal('');
  readonly mostrarTodasCategorias = signal(false);
  readonly categoriaSeleccionada = signal('');
  readonly modalidad = signal('');
  readonly orden = signal('relevancia');
  readonly precioMax = signal(0);
  readonly soloCupos = signal(false);
  readonly cursosApi = signal<Curso[]>([]);
  readonly categoriasApi = signal<Categoria[]>([]);
  readonly sugerencias = signal<Sugerencia[]>([]);
  readonly detalle = signal<Curso | null>(null);
  readonly horarios = signal<Horario[]>([]);
  readonly sedes = signal<Sede[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly errorCategorias = signal('');
  readonly avisoLimite = signal('');
  readonly pagina = signal(0);
  private busquedas = new Subject<string>();
  readonly categorias = computed(() => this.categoriasApi());
  readonly categoriasPrincipales = computed(() => this.mostrarTodasCategorias() ? this.categorias() : this.categorias().slice(0,6));
  private readonly porPagina=12;
  private solicitudVersion=0;
  readonly cursosFiltrados = computed(() => {
    const q = this.consultaAplicada().trim().toLowerCase();
    const modo = this.modalidad();
    const cat = this.categoriaSeleccionada();
    const limit = this.precioMax();
    const selected = this.cursosApi()
      .filter(c => c.status === 'PUBLISHED')
      .filter(c => !cat || c.categoryId === cat || c.categories?.some(x => x.id === cat))
      .filter(c => !q || [c.name,c.code,c.description || ''].join(' ').toLowerCase().includes(q))
      .filter(c => !modo || c.modality === modo)
      .filter(c => !limit || c.price <= limit)
      .filter(c => !this.soloCupos() || c.availableSlots > 0);
    const sort = this.orden();
    return [...selected].sort((a,b) =>
      sort === 'precio-asc' ? a.price-b.price :
      sort === 'precio-desc' ? b.price-a.price :
      sort === 'nombre' ? a.name.localeCompare(b.name) : 0);
  });
  readonly totalPaginas = computed(() => Math.max(1,Math.ceil(this.cursosFiltrados().length / this.porPagina)));
  readonly cursosVisibles = computed(() =>
    this.cursosFiltrados().slice(this.pagina()*this.porPagina,(this.pagina()+1)*this.porPagina));
  readonly cantidadTotal = computed(() => this.cursosFiltrados().length);

  ngOnInit(): void {
    this.busquedas.pipe(
      debounceTime(280),distinctUntilChanged(),
      switchMap(text => text.length>=2
        ? this.api.sugerencias(text,6).pipe(catchError(()=>of([] as Sugerencia[])))
        : of([] as Sugerencia[])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v=>this.sugerencias.set(v));
    if(this.vista==='detalle'){
      const id=this.route.snapshot.paramMap.get('id')||'';
        this.cargando.set(true);
        this.api.curso(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: c=>{this.detalle.set(c.status==='PUBLISHED'?c:null);if(c.status!=='PUBLISHED')this.error.set('El curso no está publicado.');this.cargando.set(false);},
          error: ()=>{this.error.set('No fue posible cargar el curso desde el backend.');this.cargando.set(false);}
        });
        this.api.horarios(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.horarios.set(p.content),error:()=>{}});
        this.api.sedes(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:p=>this.sedes.set(p.content),error:()=>{}});
    } else {
      this.cargarCategorias();this.cargarCursos();
    }
  }
  diaTexto(value:string):string {
    const dias:Record<string,string>={MONDAY:'Lunes',TUESDAY:'Martes',WEDNESDAY:'Miércoles',THURSDAY:'Jueves',FRIDAY:'Viernes',SATURDAY:'Sábado',SUNDAY:'Domingo'};
    return dias[value]||value;
  }
  iconoCategoria(i: number): string { return ['⌘','✦','⬡','☁','▥','◈','◎','✳','☷','◉','⚙'][i%11]; }
  nombreCategoria(c: Curso): string {
    return c.categories?.[0]?.name || this.categorias().find(x=>x.id===c.categoryId)?.name ||
      (this.categoriaSeleccionada()?this.categorias().find(x=>x.id===this.categoriaSeleccionada())?.name:'') || 'Formación profesional';
  }
  escribirBusqueda(text: string): void {this.consulta.set(text);this.busquedas.next(text.trim());}
  buscarRapido(text: string):void {this.escribirBusqueda(text);this.ejecutarBusqueda();}
  ejecutarBusqueda(): void {
    this.sugerencias.set([]);this.pagina.set(0);
    this.consultaAplicada.set(this.consulta().trim());
    this.cargarCursos();
    if(typeof document!=='undefined')document.getElementById('cursos')?.scrollIntoView({behavior:'smooth'});
  }
  elegirCategoria(id: string): void {
    this.categoriaSeleccionada.set(id);this.pagina.set(0);
    this.cargarCursos();
    if(typeof document!=='undefined')document.getElementById('cursos')?.scrollIntoView({behavior:'smooth'});
  }
  limpiar(): void {
    this.consulta.set('');this.consultaAplicada.set('');this.categoriaSeleccionada.set('');this.modalidad.set('');
    this.precioMax.set(0);this.soloCupos.set(false);this.orden.set('relevancia');this.pagina.set(0);
    this.cargarCursos();
  }
  cambiarPagina(d: number):void {
    this.pagina.update(p=>Math.max(0,Math.min(this.totalPaginas()-1,p+d)));
    this.enriquecerVista();
  }
  cambiarModalidad(v:string):void {this.modalidad.set(v);this.pagina.set(0);this.enriquecerVista();}
  cambiarPrecio(v:number):void {this.precioMax.set(v);this.pagina.set(0);this.enriquecerVista();}
  cambiarOrden(v:string):void {this.orden.set(v);this.pagina.set(0);this.enriquecerVista();}
  cambiarCupos(v:boolean):void {this.soloCupos.set(v);this.pagina.set(0);this.enriquecerVista();}
  cargarCategorias():void {
    this.errorCategorias.set('');
    this.api.categoriasActivasCompletas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:categorias=>this.categoriasApi.set(categorias),
      error:()=>this.errorCategorias.set('No se pudieron cargar las categorías.')
    });
  }
  cargarCursos():void {
    const version=++this.solicitudVersion;
    this.cargando.set(true);this.error.set('');this.avisoLimite.set('');
    const cat=this.categoriaSeleccionada();
    const q=this.consultaAplicada().trim();
    const consultar=(page:number) =>
      cat ? this.api.cursosPorCategoria(cat,page,100) :
      q ? this.api.buscarCursos(q,page,100) :
      this.api.cursosPublicados(page,100);
    consultar(0).pipe(
      switchMap(primera=>{
        // Reunir páginas antes de aplicar filtros/ordenamiento para evitar
        // resultados vacíos o conteos incorrectos por filtrar solo 12 registros.
        const limite=Math.min(Math.max(primera.totalPages,1),10);
        const restantes=Array.from({length:limite-1},(_,i)=>consultar(i+1));
        return (restantes.length?forkJoin(restantes):of([])).pipe(
          map(pages=>({items:[...primera.content,...pages.flatMap(p=>p.content)],
            incompleto:primera.totalPages>limite})));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next:({items,incompleto})=>{
        if(version!==this.solicitudVersion)return;
        this.cursosApi.set(items.map(c=>({...c,categoryId:cat || c.categoryId})));
        this.pagina.set(0);
        this.avisoLimite.set(incompleto?'El catálogo es muy amplio: muestra los primeros 1 000 registros. Refina tu búsqueda para ver otros cursos.':'');
        this.cargando.set(false);
        this.enriquecerVista();
      },
      error:()=>{
        if(version!==this.solicitudVersion)return;
        this.cursosApi.set([]);
        this.error.set('El servicio Catálogo no responde. Revisa la API, Elasticsearch y el Indexer.');
        this.cargando.set(false);
      }
    });
  }
  private enriquecerVista():void {
    const visibles=this.cursosVisibles().filter(c=>!c.categories?.length);
    if(visibles.length===0)return;
    const version=this.solicitudVersion;
    this.api.enriquecerCursos(visibles).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next:detalles=>{
        if(version!==this.solicitudVersion)return;
        const porId=new Map(detalles.map(c=>[c.id,c]));
        this.cursosApi.update(items=>items.map(c=>{
          const detalle=porId.get(c.id);
          return detalle?{...c,...detalle,categoryId:detalle.categoryId || c.categoryId}:c;
        }));
      },
      error:()=>{} // El resumen sigue siendo visible si algún detalle falla.
    });
  }

}
