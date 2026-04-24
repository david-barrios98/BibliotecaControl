import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ENVIRONMENT, apiRootUrl } from '@core/config/environment.token';
import { DASHBOARD_AREAS } from './dashboard-areas';
import { AuthzService } from '@core/auth/authz.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly env = inject(ENVIRONMENT);
  private readonly authz = inject(AuthzService);

  protected readonly areas = computed(() => {
    const isAdmin = this.authz.isAdmin();
    return DASHBOARD_AREAS.filter((a) => (a.slug === 'usuarios' ? isAdmin : true));
  });

  protected get apiRoot(): string {
    return apiRootUrl(this.env);
  }
}
