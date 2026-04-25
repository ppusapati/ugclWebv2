import { component$ } from "@builder.io/qwik";
import { type RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = ({ params, redirect }) => {
  throw redirect(302, `/admin/masters/business/${params.code}/sites`);
};

export default component$(() => null);
