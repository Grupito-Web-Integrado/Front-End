import { Component } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-matricula',
  styleUrl: './matricula.scss',
  templateUrl: './matricula.html',
})
export class Matricula {
  constructor(private router: Router, private route: ActivatedRoute) {}

  onSubmit(form: any) {
    // Store matricula in localStorage as a placeholder until backend is available
    const idCurso = this.route.snapshot.paramMap.get('idCurso') || '0';
    const record = { idCurso, ...form, estado: 'CREADA', createdAt: new Date().toISOString() };
    localStorage.setItem('matricula', JSON.stringify(record));
    this.router.navigate(['/confirmacion']);
  }
}
