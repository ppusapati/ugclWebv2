import { describe, expect, it } from 'vitest';
import { resolveAdminSidebarItem } from '~/config/admin-menu';
import { resolveHelpContext } from '~/content/help-content';
import { breadcrumbService } from '~/services/breadcrumb.service';

describe('route registry projections', () => {
  it('resolves admin sidebar route ids from canonical registry', () => {
    expect(resolveAdminSidebarItem('/')).toBe('dashboard');
    expect(resolveAdminSidebarItem('/masters/module')).toBe('modules');
    expect(resolveAdminSidebarItem('/rbac/roles')).toBe('roles');
  });

  it('keeps breadcrumb hierarchy for key admin and dynamic routes', () => {
    const roleCrumbs = breadcrumbService.getBreadcrumbs('/rbac/roles');
    expect(roleCrumbs.some((crumb) => crumb.label === 'RBAC')).toBe(true);
    expect(roleCrumbs.some((crumb) => crumb.label === 'Roles & Permissions')).toBe(true);

    const formCrumbs = breadcrumbService.getBreadcrumbs('/masters/business/FIN/forms/inspection_form');
    expect(formCrumbs.some((crumb) => crumb.label === 'Form Catalog')).toBe(true);
    expect(formCrumbs.some((crumb) => crumb.label === 'Form Detail')).toBe(true);
  });

  it('maps help context from route registry topic and variant ids', () => {
    const reportHelp = resolveHelpContext('/analytics/reports/view/42');
    expect(reportHelp.topic.id).toBe('reports');
    expect(reportHelp.variant?.id).toBe('report-view');

    const formHelp = resolveHelpContext('/masters/business/OPS/forms/incident');
    expect(formHelp.topic.id).toBe('forms');
    expect(formHelp.variant?.id).toBe('edit');
  });
});