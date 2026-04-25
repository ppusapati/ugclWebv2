import { component$ } from '@builder.io/qwik';
import { type DocumentHead, useLocation } from '@builder.io/qwik-city';
import ChatWorkspace from '~/components/chat/chat-workspace';

export default component$(() => {
  const location = useLocation();
  const conversationId = location.params.id;

  return <ChatWorkspace initialConversationId={conversationId} />;
});

export const head: DocumentHead = {
  title: 'Chat Conversation',
  meta: [
    {
      name: 'description',
      content: 'Conversation details',
    },
  ],
};
