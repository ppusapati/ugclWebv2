import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import ChatWorkspace from '~/components/chat/chat-workspace';

export default component$(() => {
  return <ChatWorkspace />;
});

export const head: DocumentHead = {
  title: 'Chat',
  meta: [
    {
      name: 'description',
      content: 'Chat with users and teams',
    },
  ],
};
