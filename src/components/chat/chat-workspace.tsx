import { $, component$, type QRL, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { chatService } from '~/services/chat.service';
import { fileService } from '~/services/file.service';
import type { ConversationDTO, MessageDTO, ReactionSummaryDTO, UserOption } from '~/types/chat';
import { Btn, PageHeader } from '~/components/ds';

interface ChatWorkspaceProps {
  initialConversationId?: string;
}

interface NewChatState {
  isOpen: boolean;
  /** 'direct' = one-to-one, 'group' = multi-person group */
  mode: 'direct' | 'group';
  search: string;
  loading: boolean;
  users: UserOption[];
  // group-specific fields
  groupTitle: string;
  groupDescription: string;
  selectedMemberIds: string[];
  creating: boolean;
}

interface EditGroupState {
  isOpen: boolean;
  title: string;
  description: string;
  saving: boolean;
}

// Common emoji set for the inline reaction picker
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function toMillis(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (now.toDateString() === date.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
}

function getMessageTypeForFile(mimeType?: string): 'file' | 'image' | 'video' | 'audio' {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
}

function normalizeIdentity(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function hasIdentity(identityKeys: string[], value: unknown): boolean {
  const normalized = normalizeIdentity(value);
  if (!normalized) return false;
  return identityKeys.includes(normalized);
}

/** Single / double / blue-double tick based on message status */
const ReadReceipt = component$<{ status: string; readCount?: number }>(
  ({ status, readCount }) => {
    const doubleTick = (colorClass: string) => (
      <span class="ml-1 inline-flex items-center gap-0.5">
        <i class={`i-heroicons-check-solid h-3 w-3 inline-block ${colorClass}`} />
        <i class={`i-heroicons-check-solid h-3 w-3 inline-block -ml-1 ${colorClass}`} />
      </span>
    );

    if (status === 'sending') {
      return <i class="i-heroicons-arrow-path-solid h-3 w-3 ml-1 inline-block animate-spin text-gray-400" />;
    }
    if (status === 'failed') {
      return <i class="i-heroicons-exclamation-circle-solid h-3 w-3 ml-1 inline-block text-red-300" />;
    }
    if (status === 'read' || (readCount !== undefined && readCount > 0)) {
      return doubleTick('text-blue-500');
    }
    if (status === 'delivered') {
      return doubleTick('text-gray-400');
    }
    return <i class="i-heroicons-check-solid h-3 w-3 ml-1 inline-block text-gray-400" />;
  }
);

/** Inline reaction summary row shown below a message bubble */
const ReactionBar = component$<{
  reactions: ReactionSummaryDTO[];
  currentUserKeys: string[];
  onToggle$: QRL<(emoji: string, alreadyReacted: boolean) => void>;
}>(({ reactions, currentUserKeys, onToggle$ }) => {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div class="mt-1 inline-flex max-w-full flex-wrap gap-1">
      {reactions.map((r) => {
        const alreadyReacted = (r.user_ids || []).some((id) =>
          hasIdentity(currentUserKeys, id)
        );
        return (
          <button
            type="button"
            key={r.reaction}
            onClick$={() => onToggle$(r.reaction, alreadyReacted)}
            class={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] transition-colors border-0 ${
              alreadyReacted
                ? 'bg-blue-50 text-blue-700'
                : 'bg-transparent text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{r.reaction}</span>
            <span class="font-medium">{r.count}</span>
          </button>
        );
      })}
    </div>
  );
});

export default component$<ChatWorkspaceProps>(({ initialConversationId }) => {
  const conversations = useSignal<ConversationDTO[]>([]);
  const messages = useSignal<MessageDTO[]>([]);
  const selectedConversationId = useSignal<string>(initialConversationId || '');
  const currentUserId = useSignal<string>('');
  const currentUserName = useSignal<string>('');
  const currentUserEmail = useSignal<string>('');
  const currentUserKeys = useSignal<string[]>([]);
  const bootstrapping = useSignal(true);

  const loadingConversations = useSignal(false);
  const loadingMessages = useSignal(false);
  const sendingMessage = useSignal(false);
  const sendingMedia = useSignal(false);
  const sharingLocation = useSignal(false);
  const error = useSignal<string | null>(null);
  const sseConnected = useSignal(false);

  const composerText = useSignal('');
  const listFilter = useSignal('');
  const activeReactionPickerId = useSignal<string>('');
  const fileInputRef = useSignal<HTMLInputElement>();
  const imageInputRef = useSignal<HTMLInputElement>();
  const cameraInputRef = useSignal<HTMLInputElement>();

  const newChat = useStore<NewChatState>({
    isOpen: false,
    mode: 'direct',
    search: '',
    loading: false,
    users: [],
    groupTitle: '',
    groupDescription: '',
    selectedMemberIds: [],
    creating: false,
  });

  const editGroup = useStore<EditGroupState>({
    isOpen: false,
    title: '',
    description: '',
    saving: false,
  });

  // ─── helpers ────────────────────────────────────────────────────────────────

  const getMessageSenderName = (
    message: MessageDTO,
    conversation?: ConversationDTO | null
  ): string => {
    const participant = conversation?.participants?.find(
      (p) => normalizeIdentity(p.user_id) === normalizeIdentity(message.sender_id)
    );

    if (participant?.user_name?.trim()) return participant.user_name;
    if (participant?.user_email?.trim()) return participant.user_email;
    return 'Unknown user';
  };

  const isMyMessage = (message: MessageDTO): boolean => {
    const raw = message as any;
    const senderCandidates = [
      raw?.sender_id,
      raw?.sender_user_id,
      raw?.sender_uuid,
      raw?.sender?.id,
      raw?.sender?.user_id,
      raw?.sender?.uuid,
    ];

    if (senderCandidates.some((value) => hasIdentity(currentUserKeys.value, value))) {
      return true;
    }

    // Additional fallback for APIs that hydrate sender profile more than IDs.
    const senderName = normalizeIdentity(raw?.sender_name || raw?.sender?.name || '');
    const senderEmail = normalizeIdentity(raw?.sender_email || raw?.sender?.email || '');

    if (
      senderName &&
      currentUserName.value &&
      senderName === normalizeIdentity(currentUserName.value)
    ) {
      return true;
    }

    if (
      senderEmail &&
      currentUserEmail.value &&
      senderEmail === normalizeIdentity(currentUserEmail.value)
    ) {
      return true;
    }

    return false;
  };

  const isMyMessageInConversation = (
    message: MessageDTO,
    conversation?: ConversationDTO | null
  ): boolean => {
    if (isMyMessage(message)) return true;

    const sender = normalizeIdentity((message as any)?.sender_id);
    if (!sender || !conversation?.participants?.length) return false;

    const senderParticipant = conversation.participants.find(
      (p) => normalizeIdentity(p.user_id) === sender
    );
    if (!senderParticipant) return false;

    if (
      currentUserName.value &&
      normalizeIdentity(senderParticipant.user_name) === normalizeIdentity(currentUserName.value)
    ) {
      return true;
    }

    if (
      currentUserEmail.value &&
      normalizeIdentity(senderParticipant.user_email) === normalizeIdentity(currentUserEmail.value)
    ) {
      return true;
    }

    return false;
  };

  const getConversationTitle = (conversation: ConversationDTO): string => {
    if (conversation.type === 'direct') {
      const otherByField = conversation.other_participant;
      const otherByParticipants = conversation.participants?.find(
        (p) => !hasIdentity(currentUserKeys.value, p.user_id)
      );

      if (
        otherByField?.user_name?.trim() &&
        !hasIdentity(currentUserKeys.value, otherByField.user_id)
      ) {
        return otherByField.user_name;
      }

      if (otherByParticipants?.user_name?.trim()) {
        return otherByParticipants.user_name;
      }

      if (otherByParticipants?.user_email?.trim()) {
        return otherByParticipants.user_email;
      }

      // Fallback only if the title is not the currently logged-in user's own name.
      const directTitle = conversation.title?.trim();
      if (directTitle) {
        const isSelfName =
          !!currentUserName.value &&
          directTitle.toLowerCase() === currentUserName.value.toLowerCase();
        if (!isSelfName) {
          return directTitle;
        }
      }

      return 'Direct Chat';
    }
    if (conversation.title?.trim()) return conversation.title;
    return 'Untitled Group';
  };

  // ─── data loaders ────────────────────────────────────────────────────────────

  const loadConversations = $(async () => {
    try {
      loadingConversations.value = true;
      error.value = null;

      const response = await chatService.listConversations({
        page: 1,
        page_size: 50,
        include_archived: false,
      });

      const next = [...(response?.conversations || [])].sort(
        (a, b) => toMillis(b.last_message_at || b.created_at) - toMillis(a.last_message_at || a.created_at)
      );

      conversations.value = next;

      if (!selectedConversationId.value && next.length > 0) {
        const preferred =
          initialConversationId && next.some((c) => c.id === initialConversationId)
            ? initialConversationId
            : next[0].id;
        selectedConversationId.value = preferred || next[0].id;
      }
    } catch (err: any) {
      error.value = err?.message || 'Failed to load conversations';
    } finally {
      loadingConversations.value = false;
    }
  });

  const loadMessages = $(async (conversationId: string) => {
    if (!conversationId) return;
    try {
      loadingMessages.value = true;
      error.value = null;

      const response = await chatService.listMessages(conversationId, {
        page: 1,
        page_size: 100,
      });

      const next = [...(response?.messages || [])].sort(
        (a, b) => toMillis(a.created_at) - toMillis(b.created_at)
      );

      messages.value = next;
      await chatService.markAsRead(conversationId).catch(() => undefined);
    } catch (err: any) {
      error.value = err?.message || 'Failed to load messages';
    } finally {
      loadingMessages.value = false;
    }
  });

  const loadUsersForNewChat = $(async (query?: string) => {
    try {
      newChat.loading = true;
      const users = query?.trim()
        ? await chatService.searchUsers(query.trim())
        : await chatService.getAllUsers();
      newChat.users = users || [];
    } catch {
      newChat.users = [];
    } finally {
      newChat.loading = false;
    }
  });

  // ─── actions ────────────────────────────────────────────────────────────────

  const selectConversation = $(async (conversationId: string) => {
    selectedConversationId.value = conversationId;
    activeReactionPickerId.value = '';
    await loadMessages(conversationId);
  });

  const sendMessage = $(async () => {
    const text = composerText.value.trim();
    const conversationId = selectedConversationId.value;
    if (!text || !conversationId) return;
    try {
      sendingMessage.value = true;
      await chatService.sendMessage(conversationId, { content: text });
      composerText.value = '';
      await loadMessages(conversationId);
      await loadConversations();
    } catch (err: any) {
      error.value = err?.message || 'Failed to send message';
    } finally {
      sendingMessage.value = false;
    }
  });

  const sendMediaFile = $(async (file: File) => {
    const conversationId = selectedConversationId.value;
    if (!conversationId || !file) return;

    try {
      sendingMedia.value = true;
      error.value = null;

      const validation = fileService.validateFile(file, {
        maxSize: 50 * 1024 * 1024,
      });
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }

      const uploaded = await fileService.uploadFile(file, 'chat');
      const messageType = getMessageTypeForFile(file.type);

      const message = await chatService.sendMessage(conversationId, {
        content: file.name,
        message_type: messageType,
        metadata: {
          filename: uploaded.filename,
          file_url: uploaded.file_url,
          content_type: uploaded.content_type,
          size: uploaded.size,
        },
      });

      await chatService.sendAttachment(conversationId, message.id, {
        dms_file_url: uploaded.file_url,
        file_name: uploaded.filename || file.name,
        file_size: uploaded.size || file.size,
        mime_type: uploaded.content_type || file.type || 'application/octet-stream',
        metadata: {
          original_name: file.name,
          source: 'chat-composer',
        },
      });

      await loadMessages(conversationId);
      await loadConversations();
    } catch (err: any) {
      error.value = err?.message || 'Failed to send file';
    } finally {
      sendingMedia.value = false;
    }
  });

  const onPickFile = $(async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await sendMediaFile(file);
    input.value = '';
  });

  const onShareLocation = $(async () => {
    const conversationId = selectedConversationId.value;
    if (!conversationId) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      error.value = 'Geolocation is not supported on this device';
      return;
    }

    try {
      sharingLocation.value = true;
      error.value = null;

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

      await chatService.sendMessage(conversationId, {
        content: `Shared location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        message_type: 'location',
        metadata: {
          lat,
          lng,
          accuracy: position.coords.accuracy,
          maps_url: mapsUrl,
        },
      });

      await loadMessages(conversationId);
      await loadConversations();
    } catch (err: any) {
      error.value = err?.message || 'Failed to share location';
    } finally {
      sharingLocation.value = false;
    }
  });

  const openNewChat = $(async () => {
    newChat.isOpen = true;
    newChat.mode = 'direct';
    newChat.search = '';
    newChat.groupTitle = '';
    newChat.groupDescription = '';
    newChat.selectedMemberIds = [];
    newChat.creating = false;
    await loadUsersForNewChat('');
  });

  const createDirectConversation = $(async (userId: string) => {
    try {
      newChat.creating = true;
      const conversation = await chatService.createConversation({
        type: 'direct',
        participant_ids: [userId],
        participant_user_ids: [userId],
      });
      newChat.isOpen = false;
      await loadConversations();
      selectedConversationId.value = conversation.id;
      await loadMessages(conversation.id);
    } catch (err: any) {
      error.value = err?.message || 'Failed to create direct chat';
    } finally {
      newChat.creating = false;
    }
  });

  const createGroupConversation = $(async () => {
    if (!newChat.groupTitle.trim()) {
      error.value = 'Group name is required';
      return;
    }
    if (newChat.selectedMemberIds.length === 0) {
      error.value = 'Select at least one member';
      return;
    }
    try {
      newChat.creating = true;
      error.value = null;
      const conversation = await chatService.createConversation({
        type: 'group',
        title: newChat.groupTitle.trim(),
        description: newChat.groupDescription.trim() || undefined,
        participant_ids: newChat.selectedMemberIds,
        participant_user_ids: newChat.selectedMemberIds,
      });
      newChat.isOpen = false;
      await loadConversations();
      selectedConversationId.value = conversation.id;
      await loadMessages(conversation.id);
    } catch (err: any) {
      error.value = err?.message || 'Failed to create group';
    } finally {
      newChat.creating = false;
    }
  });

  const openEditGroup = $(() => {
    const conversation = conversations.value.find((c) => c.id === selectedConversationId.value);
    if (!conversation || conversation.type !== 'group') {
      return;
    }
    editGroup.title = conversation.title || '';
    editGroup.description = conversation.description || '';
    editGroup.isOpen = true;
  });

  const saveGroupEdits = $(async () => {
    const conversationId = selectedConversationId.value;
    const title = editGroup.title.trim();
    if (!conversationId || !title) {
      error.value = 'Group name is required';
      return;
    }

    try {
      editGroup.saving = true;
      error.value = null;
      await chatService.updateConversation(conversationId, {
        title,
        description: editGroup.description.trim(),
      });
      editGroup.isOpen = false;
      await loadConversations();
      if (selectedConversationId.value) {
        await loadMessages(selectedConversationId.value);
      }
    } catch (err: any) {
      error.value = err?.message || 'Failed to update group';
    } finally {
      editGroup.saving = false;
    }
  });

  const toggleMember = $((userId: string) => {
    const idx = newChat.selectedMemberIds.indexOf(userId);
    if (idx >= 0) {
      newChat.selectedMemberIds = newChat.selectedMemberIds.filter((id) => id !== userId);
    } else {
      newChat.selectedMemberIds = [...newChat.selectedMemberIds, userId];
    }
  });

  const toggleReaction = $(async (messageId: string, emoji: string, alreadyReacted: boolean) => {
    try {
      if (alreadyReacted) {
        await chatService.removeReaction(messageId, emoji);
      } else {
        await chatService.addReaction(messageId, { reaction: emoji });
      }
      if (selectedConversationId.value) {
        await loadMessages(selectedConversationId.value);
      }
    } catch {
      // non-critical – ignore silently
    }
  });

  // ─── SSE + lifecycle ─────────────────────────────────────────────────────────

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ cleanup, track }) => {
    track(() => initialConversationId);

    // Read current user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const resolvedUserId = String(user?.id || user?.user_id || user?.uuid || user?.user_uuid || '');
        currentUserId.value = resolvedUserId;
        currentUserName.value = String(user?.name || user?.user_name || '').trim();
        currentUserEmail.value = String(user?.email || user?.user_email || '').trim();

        const keys = [
          user?.id,
          user?.user_id,
          user?.uuid,
          user?.user_uuid,
          user?.employee_id,
          user?.email,
          user?.user_email,
          resolvedUserId,
        ]
          .map((v) => String(v || '').trim().toLowerCase())
          .filter(Boolean);

        currentUserKeys.value = Array.from(new Set(keys));
      }
    } catch { /* ignore */ }

    if (initialConversationId) {
      selectedConversationId.value = initialConversationId;
    }

    try {
      await loadConversations();
      if (selectedConversationId.value) {
        await loadMessages(selectedConversationId.value);
      }
    } finally {
      bootstrapping.value = false;
    }

    // ── SSE subscription ──────────────────────────────────────────────────────
    const closeSSE = chatService.subscribeToChatEvents(
      async (event) => {
        sseConnected.value = true;
        const eventType = String(event.type || '').toLowerCase();
        const eventConversationId =
          event.conversation_id ||
          event.message?.conversation_id ||
          '';

        const looksLikeMessageEvent =
          eventType.includes('message') ||
          !!event.message ||
          !!eventConversationId;

        if (looksLikeMessageEvent) {
          // If the active thread received a full message payload, append without waiting for an API round trip.
          if (
            eventConversationId &&
            eventConversationId === selectedConversationId.value &&
            event.message
          ) {
            const msg = event.message;
            const exists = messages.value.some((m) => m.id === msg.id);
            if (!exists) {
              messages.value = [...messages.value, msg].sort(
                (a, b) => toMillis(a.created_at) - toMillis(b.created_at)
              );
            }
            await chatService.markAsRead(eventConversationId).catch(() => undefined);
          }

          // If active thread changed but payload is partial, force refresh thread to avoid stale UI.
          if (
            eventConversationId &&
            eventConversationId === selectedConversationId.value &&
            !event.message
          ) {
            await loadMessages(eventConversationId);
          }

          // Always refresh conversation list for preview/unread badges.
          await loadConversations();
        }
      },
      () => {
        sseConnected.value = false;
      }
    );
    sseConnected.value = true;

    // Fast fallback poll so UI stays fresh even when SSE is blocked/intermittent.
    const fallbackPoll = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      void loadConversations();
      if (selectedConversationId.value) {
        void loadMessages(selectedConversationId.value);
      }
    }, 2_000);

    cleanup(() => {
      closeSSE();
      clearInterval(fallbackPoll);
    });
  });

  // ─── derived ─────────────────────────────────────────────────────────────────

  const activeConversation =
    conversations.value.find((c) => c.id === selectedConversationId.value) || null;

  const filteredConversations = conversations.value.filter((conversation) => {
    const filter = listFilter.value.trim().toLowerCase();
    if (!filter) return true;
    const title = getConversationTitle(conversation).toLowerCase();
    const desc = (conversation.description || '').toLowerCase();
    return title.includes(filter) || desc.includes(filter);
  });

  const filteredUsers = newChat.users.filter((user) => {
    const filter = newChat.search.trim().toLowerCase();
    if (!filter) return true;
    return (
      (user.name || '').toLowerCase().includes(filter) ||
      (user.email || '').toLowerCase().includes(filter)
    );
  });

  const showInitialSkeleton =
    bootstrapping.value &&
    (loadingConversations.value || conversations.value.length === 0);

  // ─── render ──────────────────────────────────────────────────────────────────

  return (
    <div class="space-y-4">
      <PageHeader title="Chat" subtitle="Collaborate with teammates in real time">
        <Btn q:slot="actions" onClick$={openNewChat}>
          <span class="flex items-center gap-2">
            <i class="i-heroicons-plus-solid w-4 h-4 inline-block" />
            New Chat
          </span>
        </Btn>
      </PageHeader>

      {/* SSE status indicator */}
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <span
          class={`inline-block h-2 w-2 rounded-full ${
            sseConnected.value ? 'bg-green-500' : 'bg-gray-300'
          }`}
        />
        <span>Live updates</span>
      </div>

      {error.value && (
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </div>
      )}

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Conversation list ──────────────────────────────────────────── */}
        <aside class="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 p-3">
            <div class="relative">
              <i class="i-heroicons-magnifying-glass-solid absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 inline-block" />
              <input
                type="text"
                value={listFilter.value}
                onInput$={(e) => {
                  listFilter.value = (e.target as HTMLInputElement).value;
                }}
                placeholder="Search conversations"
                class="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="max-h-[68vh] overflow-auto">
            {loadingConversations.value && conversations.value.length === 0 ? (
              <div class="p-6 text-center text-sm text-gray-500">Loading…</div>
            ) : filteredConversations.length === 0 ? (
              <div class="p-6 text-center text-sm text-gray-500">No conversations found</div>
            ) : (
              filteredConversations.map((conversation) => {
                const isActive = conversation.id === selectedConversationId.value;
                return (
                  <button
                    type="button"
                    key={conversation.id}
                    onClick$={() => selectConversation(conversation.id)}
                    class={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-2">
                        {conversation.type === 'group' && (
                          <i class="i-heroicons-user-group-solid h-3.5 w-3.5 flex-shrink-0 text-blue-500 inline-block" />
                        )}
                        <p class="truncate text-sm font-semibold text-gray-900">
                          {getConversationTitle(conversation)}
                        </p>
                      </div>
                      {conversation.unread_count ? (
                        <span class="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
                          {conversation.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p class="mt-1 truncate text-xs text-gray-500">
                      {conversation.last_message?.content ||
                        conversation.description ||
                        'No messages yet'}
                    </p>
                    <p class="mt-1 text-[11px] text-gray-400">
                      {formatTime(conversation.last_message_at || conversation.created_at)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Message thread ─────────────────────────────────────────────── */}
        <section class="flex h-[68vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {showInitialSkeleton ? (
            <>
              <div class="border-b border-gray-200 px-4 py-3">
                <div class="h-4 w-40 animate-pulse rounded bg-gray-200" />
                <div class="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
              </div>
              <div class="flex-1 space-y-3 overflow-auto bg-gray-50 p-4">
                <div class="h-14 w-[78%] animate-pulse rounded-2xl bg-gray-200" />
                <div class="ml-auto h-14 w-[64%] animate-pulse rounded-2xl bg-blue-100" />
                <div class="h-14 w-[72%] animate-pulse rounded-2xl bg-gray-200" />
              </div>
              <div class="border-t border-gray-200 bg-white p-3">
                <div class="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
              </div>
            </>
          ) : activeConversation ? (
            <>
              {/* header */}
              <div class="border-b border-gray-200 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-2">
                    {activeConversation.type === 'group' && (
                      <i class="i-heroicons-user-group-solid h-4 w-4 text-blue-500 inline-block" />
                    )}
                    <p class="truncate text-sm font-semibold text-gray-900">
                      {getConversationTitle(activeConversation)}
                    </p>
                  </div>
                  {activeConversation.type === 'group' && (
                    <Btn variant="ghost" onClick$={openEditGroup}>
                      <span class="flex items-center gap-1">
                        <i class="i-heroicons-pencil-square-solid h-4 w-4 inline-block" />
                        Edit Group
                      </span>
                    </Btn>
                  )}
                </div>
                <p class="text-xs text-gray-500">
                  {activeConversation.type === 'group'
                    ? `Group · ${activeConversation.participants?.length ?? 0} members`
                    : 'Direct conversation'}
                </p>
              </div>

              {/* messages */}
              <div class="flex-1 space-y-2 overflow-auto bg-gray-50 p-4">
                {loadingMessages.value && messages.value.length === 0 ? (
                  <div class="text-center text-sm text-gray-500">Loading messages…</div>
                ) : messages.value.length === 0 ? (
                  <div class="text-center text-sm text-gray-500">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  messages.value.map((message) => {
                    const isMine = isMyMessageInConversation(message, activeConversation);
                    const senderName = getMessageSenderName(message, activeConversation);
                    const showPicker = activeReactionPickerId.value === message.id;
                    return (
                      <div
                        key={message.id}
                        class={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div class="max-w-[85%]">
                          {/* bubble */}
                          <div
                            class={`relative rounded-2xl px-3 py-2 text-sm shadow-sm ${
                              isMine
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                            }`}
                          >
                            {!isMine && (
                              <p class="mb-1 text-[11px] font-semibold text-gray-500">
                                {senderName}
                              </p>
                            )}
                            <p class="whitespace-pre-wrap break-words">{message.content}</p>

                            {message.message_type === 'location' && (
                              <div class="mt-1 text-xs">
                                {message.metadata?.maps_url ? (
                                  <a
                                    href={String(message.metadata.maps_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    class={isMine ? 'text-blue-100 underline' : 'text-blue-600 underline'}
                                  >
                                    Open in Maps
                                  </a>
                                ) : null}
                              </div>
                            )}

                            {message.attachments && message.attachments.length > 0 && (
                              <div class="mt-2 space-y-1">
                                {message.attachments.map((attachment) => {
                                  const isImage = attachment.mime_type?.startsWith('image/');
                                  return (
                                    <div key={attachment.id} class="text-xs">
                                      {isImage && attachment.dms_file_url ? (
                                        <img
                                          src={attachment.dms_file_url}
                                          alt={attachment.file_name}
                                          class="max-h-44 rounded-md border border-gray-200 object-cover"
                                        />
                                      ) : null}
                                      {attachment.dms_file_url ? (
                                        <a
                                          href={attachment.dms_file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          class={isMine ? 'text-blue-100 underline' : 'text-blue-600 underline'}
                                        >
                                          {attachment.file_name}
                                        </a>
                                      ) : (
                                        <span class={isMine ? 'text-blue-100' : 'text-gray-600'}>
                                          {attachment.file_name}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* timestamp + read receipt */}
                            <div
                              class={`mt-1 flex items-center justify-end gap-0.5 ${
                                isMine ? 'text-blue-100' : 'text-gray-400'
                              }`}
                            >
                              <span class="text-[10px]">{formatTime(message.created_at)}</span>
                              {isMine && (
                                <ReadReceipt
                                  status={message.status}
                                  readCount={message.read_count}
                                />
                              )}
                            </div>

                            {/* reaction picker trigger – appears on group:hover */}
                            <button
                              type="button"
                              onClick$={() => {
                                activeReactionPickerId.value = showPicker ? '' : message.id;
                              }}
                              class={`absolute -bottom-3 ${
                                isMine ? 'left-1' : 'right-1'
                              } hidden rounded-full border-0 bg-white/95 px-1.5 py-0.5 text-xs text-gray-500 shadow-sm hover:bg-gray-100 group-hover:block`}
                              aria-label="Add reaction"
                            >
                              <i class="i-heroicons-face-smile-solid h-3.5 w-3.5 inline-block" />
                            </button>
                          </div>

                          {/* inline emoji picker */}
                          {showPicker && (
                            <div
                              class={`mt-2 inline-flex max-w-full gap-1 rounded-full border-0 bg-white/95 px-2 py-1 shadow-md ${
                                isMine ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {COMMON_EMOJIS.map((emoji) => (
                                <button
                                  type="button"
                                  key={emoji}
                                  onClick$={async () => {
                                    const existing = message.reactions?.find(
                                      (r) =>
                                        r.reaction === emoji &&
                                        (r.user_ids || []).some((id) =>
                                          hasIdentity(currentUserKeys.value, id)
                                        )
                                    );
                                    await toggleReaction(message.id, emoji, !!existing);
                                    activeReactionPickerId.value = '';
                                  }}
                                  class="border-0 bg-transparent rounded-full px-1 py-0.5 text-lg hover:bg-gray-100"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* reaction summary row */}
                          {message.reactions && message.reactions.length > 0 && (
                            <ReactionBar
                              reactions={message.reactions}
                              currentUserKeys={currentUserKeys.value}
                              onToggle$={$((emoji, alreadyReacted) =>
                                toggleReaction(message.id, emoji, alreadyReacted)
                              )}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* composer */}
              <div class="border-t border-gray-200 bg-white p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  class="hidden"
                  onChange$={onPickFile}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  class="hidden"
                  onChange$={onPickFile}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  onChange$={onPickFile}
                />

                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <Btn
                    variant="ghost"
                    disabled={sendingMedia.value || sendingMessage.value}
                    onClick$={() => fileInputRef.value?.click()}
                  >
                    <span class="flex items-center gap-1">
                      <i class="i-heroicons-paper-clip-solid h-4 w-4 inline-block" />
                      File
                    </span>
                  </Btn>
                  <Btn
                    variant="ghost"
                    disabled={sendingMedia.value || sendingMessage.value}
                    onClick$={() => imageInputRef.value?.click()}
                  >
                    <span class="flex items-center gap-1">
                      <i class="i-heroicons-photo-solid h-4 w-4 inline-block" />
                      Image
                    </span>
                  </Btn>
                  <Btn
                    variant="ghost"
                    disabled={sendingMedia.value || sendingMessage.value}
                    onClick$={() => cameraInputRef.value?.click()}
                  >
                    <span class="flex items-center gap-1">
                      <i class="i-heroicons-camera-solid h-4 w-4 inline-block" />
                      Camera
                    </span>
                  </Btn>
                  <Btn
                    variant="ghost"
                    disabled={sharingLocation.value || sendingMessage.value}
                    onClick$={onShareLocation}
                  >
                    <span class="flex items-center gap-1">
                      <i class="i-heroicons-map-pin-solid h-4 w-4 inline-block" />
                      {sharingLocation.value ? 'Sharing...' : 'Location'}
                    </span>
                  </Btn>
                </div>

                <div class="flex items-end gap-2">
                  <textarea
                    value={composerText.value}
                    onInput$={(e) => {
                      composerText.value = (e.target as HTMLTextAreaElement).value;
                    }}
                    onKeyDown$={(e) => {
                      const event = e as KeyboardEvent;
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    class="min-h-[42px] w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <Btn
                    onClick$={sendMessage}
                    disabled={sendingMessage.value || sendingMedia.value || !composerText.value.trim()}
                  >
                    {sendingMessage.value ? 'Sending…' : 'Send'}
                  </Btn>
                </div>
              </div>
            </>
          ) : (
            <div class="flex h-full items-center justify-center p-8 text-center">
              <div>
                <i class="i-heroicons-chat-bubble-left-right-solid mx-auto mb-3 h-10 w-10 text-gray-300 inline-block" />
                <p class="text-sm font-medium text-gray-700">Select a conversation</p>
                <p class="text-xs text-gray-500">
                  Choose a chat from the left panel or start a new one.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Edit Group Modal ─────────────────────────────────────────────── */}
      {editGroup.isOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div class="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            <div class="border-b border-gray-200 px-4 py-3">
              <p class="text-base font-semibold text-gray-900">Edit Group</p>
            </div>

            <div class="space-y-3 p-4">
              <input
                type="text"
                value={editGroup.title}
                onInput$={(e) => {
                  editGroup.title = (e.target as HTMLInputElement).value;
                }}
                placeholder="Group name (required)"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={editGroup.description}
                onInput$={(e) => {
                  editGroup.description = (e.target as HTMLInputElement).value;
                }}
                placeholder="Description (optional)"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div class="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <Btn
                variant="secondary"
                onClick$={() => {
                  editGroup.isOpen = false;
                }}
              >
                Cancel
              </Btn>
              <Btn
                onClick$={saveGroupEdits}
                disabled={editGroup.saving || !editGroup.title.trim()}
              >
                {editGroup.saving ? 'Saving…' : 'Save Changes'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── New Chat / Create Group Modal ─────────────────────────────────── */}
      {newChat.isOpen && (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div class="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* modal header + tab toggle */}
            <div class="border-b border-gray-200 px-4 py-3">
              <p class="text-base font-semibold text-gray-900">New Conversation</p>
              <div class="mt-3 flex w-fit gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                <button
                  type="button"
                  onClick$={() => { newChat.mode = 'direct'; }}
                  class={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                    newChat.mode === 'direct'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Direct Message
                </button>
                <button
                  type="button"
                  onClick$={() => { newChat.mode = 'group'; }}
                  class={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                    newChat.mode === 'group'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Create Group
                </button>
              </div>
            </div>

            <div class="space-y-3 p-4">
              {/* group-only fields */}
              {newChat.mode === 'group' && (
                <div class="space-y-2">
                  <input
                    type="text"
                    value={newChat.groupTitle}
                    onInput$={(e) => {
                      newChat.groupTitle = (e.target as HTMLInputElement).value;
                    }}
                    placeholder="Group name (required)"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newChat.groupDescription}
                    onInput$={(e) => {
                      newChat.groupDescription = (e.target as HTMLInputElement).value;
                    }}
                    placeholder="Description (optional)"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {newChat.selectedMemberIds.length > 0 && (
                    <p class="text-xs font-medium text-blue-600">
                      {newChat.selectedMemberIds.length} member
                      {newChat.selectedMemberIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}

              {/* search input */}
              <input
                type="text"
                value={newChat.search}
                onInput$={(e) => {
                  newChat.search = (e.target as HTMLInputElement).value;
                }}
                placeholder={
                  newChat.mode === 'group' ? 'Search members to add…' : 'Search by name or email…'
                }
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />

              {/* user list */}
              <div class="max-h-72 overflow-auto rounded-lg border border-gray-200">
                {newChat.loading ? (
                  <div class="p-6 text-center text-sm text-gray-500">Loading users…</div>
                ) : filteredUsers.length === 0 ? (
                  <div class="p-6 text-center text-sm text-gray-500">No users found</div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected =
                      newChat.mode === 'group' && newChat.selectedMemberIds.includes(user.id);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        class={`flex w-full items-start justify-between border-b border-gray-100 px-3 py-3 text-left transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick$={() => {
                          if (newChat.mode === 'group') {
                            void toggleMember(user.id);
                          } else {
                            void createDirectConversation(user.id);
                          }
                        }}
                      >
                        <div>
                          <p class="text-sm font-medium text-gray-900">
                            {user.name || user.email || user.id}
                          </p>
                          {user.email ? (
                            <p class="text-xs text-gray-500">{user.email}</p>
                          ) : null}
                        </div>
                        {newChat.mode === 'group' ? (
                          <span
                            class={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-300 text-transparent'
                            }`}
                          >
                            <i class="i-heroicons-check-solid h-3 w-3 inline-block" />
                          </span>
                        ) : (
                          <span class="text-xs font-medium text-blue-600">Chat</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* modal footer */}
            <div class="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <Btn
                variant="secondary"
                onClick$={() => { newChat.isOpen = false; }}
              >
                Close
              </Btn>
              <Btn variant="ghost" onClick$={() => loadUsersForNewChat(newChat.search)}>
                Refresh
              </Btn>
              {newChat.mode === 'group' && (
                <Btn
                  onClick$={createGroupConversation}
                  disabled={
                    newChat.creating ||
                    !newChat.groupTitle.trim() ||
                    newChat.selectedMemberIds.length === 0
                  }
                >
                  {newChat.creating ? 'Creating…' : 'Create Group'}
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
