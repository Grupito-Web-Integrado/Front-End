import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AcademiaDemoService } from '../../core/academia-demo.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  readonly demo = inject(AcademiaDemoService);
}
