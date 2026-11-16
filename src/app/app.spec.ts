import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('MyAcademy App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[App],
      providers:[provideRouter([])]
    }).compileComponents();
  });

  it('crea el componente raíz', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la navegación MyAcademy', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.site-logo')?.textContent?.toLowerCase()).toContain('myacademy');
    expect(html.querySelector('a[href="/catalogo"]')).toBeTruthy();
  });
});
