import { Component, inject } from '@angular/core';
import { ENVIRONMENT, apiRootUrl } from '@core/config/environment.token';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly env = inject(ENVIRONMENT);

  protected get apiRoot(): string {
    return apiRootUrl(this.env);
  }
}
