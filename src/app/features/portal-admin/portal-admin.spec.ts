import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PortalAdmin } from './portal-admin';

describe('PortalAdmin · indicadores de microservicios', () => {
  let http:HttpTestingController;
  beforeEach(()=>{
    TestBed.configureTestingModule({
      imports:[PortalAdmin],
      providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]
    });
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());

  const pagina=(total:number)=>({content:[],totalElements:total,totalPages:Math.ceil(total/1),page:0,size:1});

  it('muestra indicadores que llegan de las cuatro APIs',()=>{
    const fixture=TestBed.createComponent(PortalAdmin);
    fixture.detectChanges();
    http.expectOne('/api/v1/courses/search-criteria?page=0&size=1').flush(pagina(35));
    http.expectOne('/api/v1/course-categories/all?page=0&size=1').flush(pagina(6));
    http.expectOne('/api/matriculas/admin').flush([{id:'mat-1'}]);
    http.expectOne('/api/pagos').flush([{id:1},{id:2}]);
    fixture.detectChanges();
    const c=fixture.componentInstance;
    expect(c.cursos()).toBe(35);
    expect(c.categorias()).toBe(6);
    expect(c.matriculas()).toBe(1);
    expect(c.pagos()).toBe(2);
    expect(fixture.nativeElement.querySelector('a[href="/gestion/cursos"]')).toBeTruthy();
  });

  it('no inventa métricas cuando uno de los servicios está caído',()=>{
    const fixture=TestBed.createComponent(PortalAdmin);
    fixture.detectChanges();
    http.expectOne('/api/v1/courses/search-criteria?page=0&size=1')
      .flush({message:'offline'},{status:503,statusText:'Service unavailable'});
    http.expectOne('/api/v1/course-categories/all?page=0&size=1').flush(pagina(3));
    http.expectOne('/api/matriculas/admin').flush([]);
    http.expectOne('/api/pagos').flush([]);
    expect(fixture.componentInstance.cursos()).toBeNull();
    expect(fixture.componentInstance.error()).toContain('Algunos servicios');
  });
});
