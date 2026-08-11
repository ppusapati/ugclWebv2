// src/routes/rbac/index.tsx
import { component$, Slot } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';

export default component$(() => {
  const nav = useNavigate();

  // Redirect to roles by default
  nav('/rbac/roles/');

  return (
    <Slot />
  );
});
