// src/components/breadcrumb/index.tsx
import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { breadcrumbService } from '~/services/breadcrumb.service';

export const Breadcrumb = component$(() => {
  const location = useLocation();
  const breadcrumbs = breadcrumbService.getBreadcrumbs(location.url.pathname);

  return (
    <nav class="px-6 py-3" aria-label="Breadcrumb">
      <ol class="flex items-center flex-wrap gap-y-1 text-sm text-gray-600">
        {breadcrumbs.map((crumb, index) => (
          <li key={`breadcrumb-${index}`} class="flex items-center min-h-[1.5rem]">
            {index > 0 && (
              <span class="mx-2 text-gray-400 select-none" aria-hidden="true">
                &gt;
              </span>
            )}
            <span class="flex items-center gap-1.5">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  class="inline-flex items-center gap-1.5 leading-none text-gray-600 hover:text-primary-600 transition-colors no-underline"
                >
                  {crumb.icon && <i class={`${crumb.icon} w-4 h-4 inline-block`} />}
                  <span class="leading-none">{crumb.label}</span>
                </Link>
              ) : (
                <span class="inline-flex items-center gap-1.5 leading-none text-gray-900 font-medium">
                  {crumb.icon && <i class={`${crumb.icon} w-4 h-4 inline-block`} />}
                  <span class="leading-none">{crumb.label}</span>
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
});
