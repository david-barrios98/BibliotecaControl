import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ENVIRONMENT, apiRootUrl } from '@core/config/environment.token';
import { DASHBOARD_AREAS } from './dashboard-areas';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly env = inject(ENVIRONMENT);
  protected readonly areas = DASHBOARD_AREAS;

  protected get apiRoot(): string {
    return apiRootUrl(this.env);
  }
}
