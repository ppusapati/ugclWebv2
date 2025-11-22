import { component$, useStore, useTask$  } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';

interface BreadcrumbItem {
  name: string;
  path: string;
}

export const Breadcrumb = component$(() => {
  const location = useLocation();
  const store = useStore<{ breadcrumbs: BreadcrumbItem[] }>({ breadcrumbs: [] });

  // Update breadcrumbs based on the current route
  useTask$(() => {
    const url = new URL(location.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
      return {
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        path: '/' + pathSegments.slice(0, index + 1).join('/')
      };
    });
    store.breadcrumbs = breadcrumbs;
  });

  return (
    <nav class='flex py-4' aria-label="breadcrumb">
      <ol class='inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse'>
      <li class="inline-flex items-center">
      <a href="/" class="animate-fade-in inline-flex no-underline items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
       <span class="w-4 h-4 me-1.5 i-mdi-home" aria-hidden="true"/> 
        Home
      </a>
    </li>
        {store.breadcrumbs.map((breadcrumb, index) => (
          <li key={index} class='inline-flex items-center text-gray-700'>
           <span class='i-carbon-chevron-right' />
            {index < store.breadcrumbs.length - 1 ? (
              <a
                class="animate-fade-in inline-flex no-underline items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
                href={breadcrumb.path}
              >
                {breadcrumb.name}
              </a>
            ) : (
              <span class="animate-fade-in inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400">
                {breadcrumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
     </nav>
  );
});