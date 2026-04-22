import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ENVIRONMENT } from '@core/config/environment.token';

export interface ModuleHubRouteData {
  title: string;
  intro: string;
  actions: { label: string; detail: string }[];
}

@Component({
  selector: 'app-module-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './module-hub.component.html',
  styleUrl: './module-hub.component.scss',
})
export class ModuleHubComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly env = inject(ENVIRONMENT);

  protected get hub(): ModuleHubRouteData {
    return this.route.snapshot.data['hub'] as ModuleHubRouteData;
  }
}
