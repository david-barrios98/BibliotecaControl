export interface DashboardOption {
  label: string;
  hint: string;
}

export interface DashboardArea {
  slug: string;
  route: string;
  badge: string;
  title: string;
  summary: string;
  options: DashboardOption[];
}
