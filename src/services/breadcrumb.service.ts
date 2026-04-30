// src/services/breadcrumb.service.ts
import { getBreadcrumbRouteConfigs, getRoutePatternScore } from '~/config/route-registry';

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
  // Route definitions are centralized in route-registry.
  private routeConfigs: RouteConfig[] = getBreadcrumbRouteConfigs();

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
    // Try direct best-match first (supports dynamic patterns).
    let route = this.getBestMatchingRoute(path);
    if (route) {
      return route;
    }

    // Try to find the closest matching parent path.
    const segments = path.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
      const partialPath = '/' + segments.slice(0, i).join('/');
      route = this.getBestMatchingRoute(partialPath);
      if (route) {
        return route;
      }
    }

    return undefined;
  }

  private getBestMatchingRoute(path: string): RouteConfig | undefined {
    let bestRoute: RouteConfig | undefined;
    let bestScore = -1;

    for (const route of this.routeConfigs) {
      const score = getRoutePatternScore(path, route.path);
      if (score > bestScore) {
        bestScore = score;
        bestRoute = route;
      }
    }

    return bestScore >= 0 ? bestRoute : undefined;
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
