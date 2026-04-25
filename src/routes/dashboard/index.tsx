import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';

export const useDefaultDashboardRedirect = routeLoader$(async (requestEvent) => {
  throw requestEvent.redirect(302, '/analytics/dashboards');
});

export default component$(() => {
  useDefaultDashboardRedirect();
  return null;
});