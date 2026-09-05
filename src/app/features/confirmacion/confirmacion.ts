import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-confirmacion',
  styleUrl: './confirmacion.scss',
  templateUrl: './confirmacion.html',
})
export class Confirmacion implements AfterViewInit {
  ngAfterViewInit(): void {
    const raw = localStorage.getItem('matricula');
    const summaryEl = document.getElementById('summary');
    if (summaryEl) summaryEl.textContent = raw || 'No hay matrícula registrada';

    const dl = document.getElementById('download');
    if (dl) dl.addEventListener('click', () => this.downloadReceipt());
  }

  downloadReceipt() {
    const raw = localStorage.getItem('matricula') || '{}';
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comprobante_matricula.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}
