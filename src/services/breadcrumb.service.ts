// src/services/breadcrumb.service.ts

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  parent?: string;
}

class BreadcrumbService {
  // Define route configurations for breadcrumb generation
  private routeConfigs: RouteConfig[] = [
    // Dashboard
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'i-heroicons-home-solid' },
    { path: '/dashboard', label: 'Dashboard', icon: 'i-heroicons-home-solid' },

    // Admin routes
    { path: '/admin', label: 'Admin', icon: 'i-heroicons-shield-check-solid' },
    { path: '/admin/masters', label: 'Masters', icon: 'i-heroicons-cube-solid', parent: '/admin' },
    { path: '/admin/masters/module', label: 'Modules', icon: 'i-streamline-module-three-solid', parent: '/admin/masters' },
    { path: '/admin/masters/sites', label: 'Sites', icon: 'i-heroicons-map-pin-solid', parent: '/admin/masters' },
    { path: '/admin/masters/business-verticals', label: 'Business Verticals', icon: 'i-heroicons-building-office-solid', parent: '/admin/masters' },
    { path: '/admin/masters/sites/new', label: 'New Site', icon: 'i-heroicons-plus-circle-solid', parent: '/admin/masters/sites' },
    { path: '/admin/users', label: 'Users', icon: 'i-heroicons-users-solid', parent: '/admin' },
    { path: '/admin/rbac', label: 'RBAC', icon: 'i-heroicons-shield-check-solid', parent: '/admin' },
    { path: '/admin/rbac/global-roles', label: 'Global Roles', icon: 'i-heroicons-shield-check-solid', parent: '/admin/rbac' },
    { path: '/admin/rbac/business-roles', label: 'Business Roles', icon: 'i-heroicons-building-office-solid', parent: '/admin/rbac' },
    { path: '/admin/rbac/permissions', label: 'Permissions', icon: 'i-heroicons-key-solid', parent: '/admin/rbac' },

    // ABAC Policy routes
    { path: '/admin/policies', label: 'ABAC Policies', icon: 'i-heroicons-shield-check-solid', parent: '/admin' },
    { path: '/admin/policies/create', label: 'Create Policy', icon: 'i-heroicons-plus-circle-solid', parent: '/admin/policies' },
    { path: '/admin/attributes', label: 'Attributes', icon: 'i-heroicons-tag-solid', parent: '/admin' },

    { path: '/dashboard/admin/roles', label: 'Roles & Permissions', icon: 'i-heroicons-key-solid', parent: '/dashboard' },
    { path: '/admin/settings', label: 'Settings', icon: 'i-heroicons-cog-6-tooth-solid', parent: '/admin' },
    { path: '/admin/audit', label: 'Audit Logs', icon: 'i-heroicons-document-text-solid', parent: '/admin' },
    { path: '/admin/backup', label: 'Backup', icon: 'i-heroicons-cloud-arrow-down-solid', parent: '/admin' },

    // HR routes
    { path: '/hr', label: 'HR', icon: 'i-heroicons-users-solid' },
    { path: '/hr/employees', label: 'Employees', icon: 'i-heroicons-user-group-solid', parent: '/hr' },
    { path: '/hr/recruitment', label: 'Recruitment', icon: 'i-heroicons-user-plus-solid', parent: '/hr' },
    { path: '/hr/payroll', label: 'Payroll', icon: 'i-heroicons-banknotes-solid', parent: '/hr' },
    { path: '/hr/performance', label: 'Performance', icon: 'i-heroicons-chart-bar-solid', parent: '/hr' },
    { path: '/hr/training', label: 'Training', icon: 'i-heroicons-academic-cap-solid', parent: '/hr' },
    { path: '/hr/policies', label: 'Policies', icon: 'i-heroicons-document-text-solid', parent: '/hr' },

    // Finance routes
    { path: '/finance', label: 'Finance', icon: 'i-heroicons-currency-rupee-solid' },
    { path: '/finance/accounts', label: 'Accounts', icon: 'i-heroicons-building-library-solid', parent: '/finance' },
    { path: '/finance/invoices', label: 'Invoices', icon: 'i-heroicons-document-duplicate-solid', parent: '/finance' },
    { path: '/finance/expenses', label: 'Expenses', icon: 'i-heroicons-receipt-percent-solid', parent: '/finance' },
    { path: '/finance/budgets', label: 'Budgets', icon: 'i-heroicons-calculator-solid', parent: '/finance' },
    { path: '/finance/reports', label: 'Reports', icon: 'i-heroicons-chart-pie-solid', parent: '/finance' },
    { path: '/finance/taxes', label: 'Taxes', icon: 'i-heroicons-clipboard-document-check-solid', parent: '/finance' },

    // Operations routes
    { path: '/operations', label: 'Operations', icon: 'i-heroicons-cog-solid' },
    { path: '/operations/projects', label: 'Projects', icon: 'i-heroicons-folder-open-solid', parent: '/operations' },
    { path: '/operations/inventory', label: 'Inventory', icon: 'i-heroicons-cube-transparent-solid', parent: '/operations' },
    { path: '/operations/suppliers', label: 'Suppliers', icon: 'i-heroicons-truck-solid', parent: '/operations' },
    { path: '/operations/quality', label: 'Quality Control', icon: 'i-heroicons-shield-check-solid', parent: '/operations' },
    { path: '/operations/maintenance', label: 'Maintenance', icon: 'i-heroicons-wrench-screwdriver-solid', parent: '/operations' },

    // Sales routes
    { path: '/sales', label: 'Sales', icon: 'i-heroicons-currency-dollar-solid' },
    { path: '/sales/leads', label: 'Leads', icon: 'i-heroicons-funnel-solid', parent: '/sales' },
    { path: '/sales/customers', label: 'Customers', icon: 'i-heroicons-user-group-solid', parent: '/sales' },
    { path: '/sales/orders', label: 'Orders', icon: 'i-heroicons-shopping-cart-solid', parent: '/sales' },
    { path: '/sales/pipeline', label: 'Pipeline', icon: 'i-heroicons-arrow-trending-up-solid', parent: '/sales' },
    { path: '/sales/analytics', label: 'Analytics', icon: 'i-heroicons-chart-bar-square-solid', parent: '/sales' },
  ];

  /**
   * Get breadcrumb items for a given path
   */
  getBreadcrumbs(currentPath: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({
      label: 'Home',
      href: '/dashboard',
      icon: 'i-heroicons-home-solid',
    });

    // Find the current route config
    const currentRoute = this.findRouteConfig(currentPath);

    if (!currentRoute) {
      // If no route config found, generate breadcrumbs from path segments
      return this.generateFromPath(currentPath);
    }

    // Build breadcrumb chain from parent hierarchy
    const chain = this.buildChain(currentRoute);

    // Convert chain to breadcrumb items
    chain.forEach((route, index) => {
      breadcrumbs.push({
        label: route.label,
        href: index === chain.length - 1 ? undefined : route.path, // Last item has no link
        icon: route.icon,
      });
    });

    return breadcrumbs;
  }

  /**
   * Find route configuration for a given path
   */
  private findRouteConfig(path: string): RouteConfig | undefined {
    // Try exact match first
    let route = this.routeConfigs.find(r => r.path === path);

    if (route) return route;

    // Try to find the closest matching parent path
    const segments = path.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
      const partialPath = '/' + segments.slice(0, i).join('/');
      route = this.routeConfigs.find(r => r.path === partialPath);
      if (route) return route;
    }

    return undefined;
  }

  /**
   * Build breadcrumb chain from current route to root
   */
  private buildChain(route: RouteConfig): RouteConfig[] {
    const chain: RouteConfig[] = [route];
    let current = route;

    while (current.parent) {
      const parent = this.routeConfigs.find(r => r.path === current.parent);
      if (!parent) break;
      chain.unshift(parent);
      current = parent;
    }

    return chain;
  }

  /**
   * Generate breadcrumbs from path segments when no config found
   */
  private generateFromPath(path: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [{
      label: 'Home',
      href: '/dashboard',
      icon: 'i-heroicons-home-solid',
    }];

    const segments = path.split('/').filter(Boolean);
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += '/' + segment;
      const isLast = index === segments.length - 1;

      // Capitalize and format segment
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  }

  /**
   * Add a custom route configuration
   */
  addRoute(config: RouteConfig): void {
    const existingIndex = this.routeConfigs.findIndex(r => r.path === config.path);
    if (existingIndex >= 0) {
      this.routeConfigs[existingIndex] = config;
    } else {
      this.routeConfigs.push(config);
    }
  }

  /**
   * Get label for a specific path
   */
  getLabel(path: string): string {
    const route = this.findRouteConfig(path);
    return route?.label || path.split('/').pop() || '';
  }

  /**
   * Get parent path for a given path
   */
  getParentPath(path: string): string | undefined {
    const route = this.findRouteConfig(path);
    return route?.parent;
  }
}

// Export singleton instance
export const breadcrumbService = new BreadcrumbService();
