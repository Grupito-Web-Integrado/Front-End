import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  imports: [CommonModule, FormsModule, RouterModule]
})
export class Login {
  protected username = signal('');
  protected password = signal('');
  protected error = signal<string | null>(null);

  constructor(private router: Router) {}

  submit(e: Event) {
    e.preventDefault();
    const u = this.username();
    const p = this.password();
    if (!u || !p) return this.error.set('Usuario y contraseña requeridos');
    // Placeholder auth: store user in localStorage. Backend Keycloak integration will replace this.
    localStorage.setItem('user', JSON.stringify({ username: u }));
    this.router.navigate(['/catalogo']);
  }
}
