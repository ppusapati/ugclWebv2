// src/components/breadcrumb/index.tsx
import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { breadcrumbService } from '~/services/breadcrumb.service';

export const Breadcrumb = component$(() => {
  const location = useLocation();
  const breadcrumbs = breadcrumbService.getBreadcrumbs(location.url.pathname);

  return (
    <nav class="flex items-center text-sm text-gray-600 mb-4 px-6 pt-4" aria-label="Breadcrumb">
      <ol class="flex items-center">
        {breadcrumbs.map((crumb, index) => (
          <span key={`breadcrumb-${index}`}>
            {index > 0 && (
              <li class="flex items-center mx-2 text-gray-400">
                <i class="i-heroicons-chevron-right-solid w-3.5 h-3.5" />
              </li>
            )}
            <li class="flex items-center">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  class="flex items-center gap-1.5 text-gray-600 hover:text-primary-600 transition-colors no-underline"
                >
                  {crumb.icon && <i class={`${crumb.icon} w-4 h-4 inline-block`} />}
                  <span class="inline-block align-middle">{crumb.label}</span>
                </Link>
              ) : (
                <span class="flex items-center gap-1.5 text-gray-900 font-medium">
                  {crumb.icon && <i class={`${crumb.icon} w-4 h-4 inline-block`} />}
                  <span class="inline-block align-middle">{crumb.label}</span>
                </span>
              )}
            </li>
          </span>
        ))}
      </ol>
    </nav>
  );
});
