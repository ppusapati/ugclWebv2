import { component$ } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';

export const onGet: RequestHandler = async ({ params, redirect }) => {
  throw redirect(302, `/admin/masters/business/${params.code}/sites`);
};

export default component$(() => {
  return <div>Redirecting...</div>;
});
