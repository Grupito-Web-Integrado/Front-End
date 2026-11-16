import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Curso } from '../../core/academia.models';
import { portadaCurso } from '../../core/course-cover';

@Component({
  selector: 'app-curso-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <article class="course-card">
    <a class="course-cover" [ngClass]="'cover-'+paleta()" [routerLink]="['/curso', curso.id]" [attr.aria-label]="'Ver '+curso.name">
      <img [src]="imagen()" [alt]="'Imagen ilustrativa: '+curso.name" loading="lazy" (error)="imagenError($event)">
      <span class="course-cover-grid"></span>
      <span class="course-cover-code">{{ curso.code }}</span>
    </a>
    <div class="course-card-content">
      <div class="course-card-top"><span>{{ categoria }}</span><span>{{ modalidad() }}</span></div>
      <a [routerLink]="['/curso', curso.id]" class="course-title">{{ curso.name }}</a>
      <p class="course-description">{{ curso.description || 'Formación práctica con proyectos y acompañamiento.' }}</p>
      <div class="course-facts">
        <span>◷ {{ curso.durationHours || '—' }} h</span>
        <span>◉ {{ curso.availableSlots }} cupos</span>
      </div>
      <div class="course-card-footer">
        <div><small>Desde</small><strong>S/ {{ curso.price | number:'1.2-2' }}</strong></div>
        <a class="small-primary" [routerLink]="['/curso', curso.id]">Explorar curso <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>
  `
})
export class CursoCard {
  @Input({ required: true }) curso!: Curso;
  @Input() categoria = 'Formación tecnológica';
  imagen():string{return portadaCurso(this.curso);}
  imagenError(event: Event):void{
    const el=event.target as HTMLImageElement;
    if (!el.src.endsWith('area-0.svg')) el.src='/course-covers/area-0.svg';
  }
  paleta(): number { return (this.curso.name.length + this.curso.code.length) % 6; }
  modalidad(): string {
    return this.curso.modality === 'ONLINE' ? 'Online' : this.curso.modality === 'IN_PERSON' ? 'Presencial' : 'Híbrido';
  }
  simbolo(): string {
    const texto = this.curso.name.toLowerCase();
    if (/java|spring|python|angular|react|web|flutter|sql/.test(texto)) return '</>';
    if (/ia|inteligencia|machine|agentes|prompt/.test(texto)) return '✦';
    if (/seguridad|hacking|redes/.test(texto)) return '⬡';
    if (/cloud|aws|azure|docker|devops/.test(texto)) return '☁';
    if (/diseño|ux|figma|gráfico/.test(texto)) return '◈';
    if (/excel|power bi|datos/.test(texto)) return '▥';
    return '◎';
  }
}
