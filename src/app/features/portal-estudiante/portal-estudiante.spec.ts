import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PortalEstudiante } from './portal-estudiante';

describe('PortalEstudiante · matrícula real y estados', () => {
  let http:HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[PortalEstudiante],
      providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]
    });
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(()=>http.verify());

  const curso={
    id:'m-1',courseId:'c-1',courseName:'Java',
    nombre:'Estudiante',correo:'estudiante@example.invalid',
    tipoDocumento:'DNI',documento:'12345678',telefono:'',
    fecha:'2026-11-20T10:00:00',estado:'CREADA',importe:180,origen:'API'
  };

  it('obtiene solicitudes del usuario actual sin utilizar mocks ni API de administrador', () => {
    const fixture=TestBed.createComponent(PortalEstudiante);
    fixture.detectChanges();
    const req=http.expectOne('/api/matriculas');
    expect(req.request.method).toBe('GET');
    req.flush([curso,{...curso,id:'m-2',estado:'CONFIRMADA'}]);
    fixture.detectChanges();
    expect(fixture.componentInstance.matriculas().length).toBe(2);
    expect(fixture.componentInstance.confirmadas()).toBe(1);
    expect(fixture.componentInstance.pendientes()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Java');
    fixture.componentInstance.filtro.set('CONFIRMADA');
    expect(fixture.componentInstance.visibles().length).toBe(1);
  });

  it('expone error y permite reintentar si Matrículas está apagado', () => {
    const fixture=TestBed.createComponent(PortalEstudiante);
    fixture.detectChanges();
    http.expectOne('/api/matriculas').flush({message:'offline'},{status:503,statusText:'Service unavailable'});
    expect(fixture.componentInstance.error()).toContain('503');
    fixture.componentInstance.cargar();
    http.expectOne('/api/matriculas').flush([]);
    expect(fixture.componentInstance.error()).toBe('');
    expect(fixture.componentInstance.matriculas()).toEqual([]);
  });
});
