import { component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { LoginForm } from '~/components/auth/login_form';

export const onGet: RequestHandler = async () => {
  // Keep login route always reachable to avoid stale-cookie redirect loops.
};

export default component$(() => {

  return <LoginForm />
});
