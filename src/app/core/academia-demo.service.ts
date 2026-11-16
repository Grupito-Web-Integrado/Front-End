import { Injectable, signal } from '@angular/core';
import { Categoria, Curso, Matricula, Pago } from './academia.models';

/**
 * Compatibilidad con los formularios antiguos. El modo DEMO está retirado:
 * todos los datos visibles proceden de los microservicios.
 * Los fixtures de src/app/core/demo-catalog.ts solo se conservan para
 * pruebas del sistema, sin cargarse jamás en una sesión del navegador.
 */
@Injectable({providedIn:'root'})
export class AcademiaDemoService {
  private readonly _modo=signal<'demo'|'api'>('api');
  readonly modo=this._modo.asReadonly();
  readonly cursos=signal<Curso[]>([]);
  readonly categorias=signal<Categoria[]>([]);
  readonly matriculas=signal<Matricula[]>([]);
  readonly pagos=signal<Pago[]>([]);
  readonly perfilDemo=signal<'estudiante'|'administrador'>('estudiante');

  establecerModo(_modo:'demo'|'api'):void {
    // La aplicación ya no permite alternar a datos falsos.
    this._modo.set('api');
  }
  establecerPerfilDemo(_perfil:'estudiante'|'administrador'):void {
    throw new Error('Los perfiles de demostración han sido retirados. Inicia sesión con Keycloak.');
  }
  registrarCurso(_item:Curso):void {throw new Error('Utiliza la API de Catálogo.');}
  actualizarCurso(_id:string,_cambios:Partial<Curso>):void {throw new Error('Utiliza la API de Catálogo.');}
  registrarCategoria(_item:Categoria):void {throw new Error('Utiliza la API de Catálogo.');}
  actualizarCategoria(_id:string,_cambios:Partial<Categoria>):void {throw new Error('Utiliza la API de Catálogo.');}
  registrarMatricula(_item:Matricula):void {throw new Error('Utiliza la API de Matrículas.');}
  registrarPago(_monto:number):Pago {throw new Error('Utiliza la API de Pagos.');}
  actualizarPago(_id:number,_estado:Pago['estado']):void {throw new Error('Utiliza la API de Pagos.');}
}
