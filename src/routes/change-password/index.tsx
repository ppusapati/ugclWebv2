import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';

export default component$(() => {
  const nav = useNavigate();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    void nav('/profile?section=password');
  });

  return (
    <div class="flex items-center justify-center py-16">
      <p class="text-neutral-600">Redirecting to profile security settings...</p>
    </div>
  );
});
