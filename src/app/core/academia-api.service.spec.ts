import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AcademiaApiService } from './academia-api.service';
import { Curso } from './academia.models';

describe('AcademiaApiService - contratos de microservicios', () => {
  let api: AcademiaApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    api = TestBed.inject(AcademiaApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  const pagina = (content: unknown[], totalPages=1) => ({
    content, totalElements: content.length, totalPages, page:0, size:100
  });

  it('solicita todas las páginas de categorías activas', () => {
    let actual: string[] = [];
    api.categoriasActivasCompletas().subscribe(items => actual = items.map(c=>c.name));
    http.expectOne('/api/v1/course-categories/active?page=0&size=100')
      .flush({ ...pagina([{id:'1',name:'Programación',status:'ACTIVE'}], 2), totalElements:101 });
    http.expectOne('/api/v1/course-categories/active?page=1&size=100')
      .flush(pagina([{id:'2',name:'Datos',status:'ACTIVE'}]));
    expect(actual).toEqual(['Programación','Datos']);
  });

  it('enriquece resultados de búsqueda con su categoría real desde CourseDto', () => {
    const resumen = {
      id:'11111111-1111-4111-8111-111111111111',code:'JAVA-01',name:'Java',
      modality:'ONLINE',price:120,currency:'PEN',capacity:30,availableSlots:29,
      status:'PUBLISHED'
    } as Curso;
    let items: Curso[] = [];
    api.enriquecerCursos([resumen]).subscribe(x=>items=x);
    http.expectOne('/api/v1/courses/'+resumen.id).flush({
      ...resumen,description:'Curso Java',categories:[{id:'cat-1',name:'Programación',status:'ACTIVE'}],
      schedules:[],locations:[]
    });
    expect(items.length).toBe(1);
    expect(items[0].categoryId).toBe('cat-1');
    expect(items[0].description).toBe('Curso Java');
  });

  it('consulta cursos publicados sin pedir los DRAFT', () => {
    let result = 0;
    api.cursosPublicados(0,12).subscribe(p=>result=p.totalElements);
    const req=http.expectOne('/api/v1/courses/published?page=0&size=12');
    expect(req.request.method).toBe('GET');
    req.flush({...pagina([]),totalElements:0});
    expect(result).toBe(0);
  });

  it('envía POST de horario con courseId y horas', () => {
    api.crearHorario({courseId:'course-id',dayOfWeek:'MONDAY',
      startTime:'18:00',endTime:'20:00',room:'Aula 101'}).subscribe();
    const req=http.expectOne('/api/v1/course-schedules');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({courseId:'course-id',dayOfWeek:'MONDAY',
      startTime:'18:00',endTime:'20:00',room:'Aula 101'});
    req.flush({success:true});
  });

  it('actualiza el precio con amount y currency, como espera Java', () => {
    api.cambiarPrecioCurso('curso-1',149,'PEN').subscribe();
    const req=http.expectOne('/api/v1/courses/curso-1/price');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({amount:149,currency:'PEN'});
    req.flush({success:true});
  });

  it('obtiene y consulta los pagos por rutas propias', () => {
    api.listarPagos().subscribe();
    const req=http.expectOne('/api/pagos');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
  it('registra matrícula sin importe enviado por el navegador', () => {
    const datos={courseId:'11111111-1111-4111-8111-111111111111',
      nombre:'Alumno Demo',correo:'ejemplo@demo.invalid',telefono:'',
      tipoDocumento:'DNI',documento:'12345678'};
    api.registrarMatricula(datos).subscribe();
    const req=http.expectOne('/api/matriculas');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(datos);
    expect(req.request.body).not.toHaveProperty('importe');
    expect(req.request.body).not.toHaveProperty('studentId');
    req.flush({id:'mat-1',estado:'CREADA',origen:'API'});
  });

  it('consulta matrículas solo del perfil actual, y admin por ruta separada', () => {
    api.listarMatriculas().subscribe();
    const own=http.expectOne('/api/matriculas');
    expect(own.request.method).toBe('GET');
    own.flush([]);
    api.listarMatriculasAdmin().subscribe();
    const admin=http.expectOne('/api/matriculas/admin');
    expect(admin.request.method).toBe('GET');
    admin.flush([]);
  });

});
