import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [RouterOutlet, CommonModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend-plataforma-cursos');
  protected readonly user = signal<{ username?: string } | null>(null);
constructor(private router: Router) {
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = localStorage.getItem('user');
    if (raw) this.user.set(JSON.parse(raw));
  }
}
  logout() {
    localStorage.removeItem('user');
    this.user.set(null);
    this.router.navigate(['/login']);
  }
}
