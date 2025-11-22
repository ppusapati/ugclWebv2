// src/routes/admin/authorization/index.tsx
import { component$ } from '@builder.io/qwik';
import { AuthorizationDashboard } from '~/components/auth/authorization-dashboard';

export default component$(() => {
  return <AuthorizationDashboard />;
});