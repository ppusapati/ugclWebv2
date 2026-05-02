import { apiClient } from './api-client';
import { resolveApiBaseUrl } from '~/config/api';
import type {
  ConversationDTO,
  MessageDTO,
  ParticipantDTO,
  AttachmentDTO,
  ReactionSummaryDTO,
  CreateConversationRequest,
  CreateGroupRequest,
  SendMessageRequest,
  UpdateMessageRequest,
  UpdateConversationRequest,
  AddParticipantRequest,
  UpdateParticipantRoleRequest,
  AddReactionRequest,
  SendAttachmentRequest,
  ConversationListResponse,
  MessageListResponse,
  ParticipantListResponse,
  ConversationFilters,
  MessageFilters,
  UserOption,
} from '../types/chat';

/**
 * Chat Service
 * Handles all chat-related API calls
 */
export class ChatService {
  private baseUrl = '/chat';

  private unwrapPayload<T>(response: any, key?: string): T {
    if (!response || typeof response !== 'object') {
      return response as T;
    }

    if (response.data && typeof response.data === 'object') {
      return key ? (response.data[key] as T) : (response.data as T);
    }

    return key ? (response[key] as T) : (response as T);
  }

  // ============================================================================
  // Conversation endpoints
  // ============================================================================

  /**
   * Create a new conversation
   */
  async createConversation(req: CreateConversationRequest): Promise<ConversationDTO> {
    const response = await apiClient.post(`${this.baseUrl}/conversations`, req) as any;
    return this.unwrapPayload<ConversationDTO>(response, 'conversation');
  }

  /**
   * Create a new group (admin only)
   */
  async createGroup(req: CreateGroupRequest): Promise<ConversationDTO> {
    const response = await apiClient.post(`${this.baseUrl}/groups`, req) as any;
    // Backend returns `group` for this endpoint.
    return this.unwrapPayload<ConversationDTO>(response, 'group');
  }

  /**
   * List user's conversations with optional filters
   */
  async listConversations(filters?: ConversationFilters): Promise<ConversationListResponse> {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.include_archived !== undefined) params.append('include_archived', String(filters.include_archived));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/conversations?${queryString}` : `${this.baseUrl}/conversations`;

    const response = await apiClient.get(url) as any;
    return this.unwrapPayload<ConversationListResponse>(response);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(id: string): Promise<ConversationDTO> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${id}`) as any;
    return this.unwrapPayload<ConversationDTO>(response, 'conversation');
  }

  /**
   * Update a conversation
   */
  async updateConversation(id: string, req: UpdateConversationRequest): Promise<ConversationDTO> {
    const response = await apiClient.put(`${this.baseUrl}/conversations/${id}`, req) as any;
    return this.unwrapPayload<ConversationDTO>(response, 'conversation');
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/conversations/${id}`);
  }

  /**
   * Archive/unarchive a conversation
   */
  async archiveConversation(id: string, archive: boolean): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/conversations/${id}/archive`, { archive });
  }

  // ============================================================================
  // Message endpoints
  // ============================================================================

  /**
   * Send a message to a conversation
   */
  async sendMessage(conversationId: string, req: SendMessageRequest): Promise<MessageDTO> {
    const response = await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/messages`, req) as any;
    return this.unwrapPayload<MessageDTO>(response, 'message');
  }

  /**
   * List messages in a conversation
   */
  async listMessages(conversationId: string, filters?: MessageFilters): Promise<MessageListResponse> {
    const params = new URLSearchParams();

    if (filters?.before) params.append('before', filters.before);
    if (filters?.after) params.append('after', filters.after);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.page_size) params.append('page_size', String(filters.page_size));

    const queryString = params.toString();
    const url = queryString
      ? `${this.baseUrl}/conversations/${conversationId}/messages?${queryString}`
      : `${this.baseUrl}/conversations/${conversationId}/messages`;

    const response = await apiClient.get(url) as any;
    return this.unwrapPayload<MessageListResponse>(response);
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(conversationId: string, query: string, page?: number, pageSize?: number): Promise<MessageListResponse> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (page) params.append('page', String(page));
    if (pageSize) params.append('page_size', String(pageSize));

    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/messages/search?${params.toString()}`) as any;
    return this.unwrapPayload<MessageListResponse>(response);
  }

  /**
   * Get a specific message
   */
  async getMessage(id: string): Promise<MessageDTO> {
    const response = await apiClient.get(`${this.baseUrl}/messages/${id}`) as any;
    return this.unwrapPayload<MessageDTO>(response, 'message');
  }

  /**
   * Update a message
   */
  async updateMessage(id: string, req: UpdateMessageRequest): Promise<MessageDTO> {
    const response = await apiClient.put(`${this.baseUrl}/messages/${id}`, req) as any;
    return this.unwrapPayload<MessageDTO>(response, 'message');
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/messages/${id}`);
  }

  // ============================================================================
  // Participant endpoints
  // ============================================================================

  /**
   * Add a participant to a conversation
   */
  async addParticipant(conversationId: string, req: AddParticipantRequest): Promise<ParticipantDTO> {
    const response = await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/participants`, req) as any;
    return this.unwrapPayload<ParticipantDTO>(response, 'participant');
  }

  /**
   * List participants in a conversation
   */
  async listParticipants(conversationId: string): Promise<ParticipantListResponse> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/participants`) as any;
    return this.unwrapPayload<ParticipantListResponse>(response);
  }

  /**
   * Remove a participant from a conversation
   */
  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/conversations/${conversationId}/participants/${userId}`);
  }

  /**
   * Update a participant's role
   */
  async updateParticipantRole(conversationId: string, userId: string, req: UpdateParticipantRoleRequest): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/conversations/${conversationId}/participants/${userId}/role`, req);
  }

  // ============================================================================
  // Read receipts & Typing indicators
  // ============================================================================

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/read`, { message_id: messageId });
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/conversations/${conversationId}/typing`);
  }

  /**
   * Get typing users
   */
  async getTypingUsers(conversationId: string): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/typing`) as any;
    return this.unwrapPayload<string[]>(response, 'users') || [];
  }

  // ============================================================================
  // Reaction endpoints
  // ============================================================================

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, req: AddReactionRequest): Promise<void> {
    await apiClient.post(`${this.baseUrl}/messages/${messageId}/reactions`, req);
  }

  /**
   * List reactions for a message
   */
  async listReactions(messageId: string): Promise<ReactionSummaryDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/messages/${messageId}/reactions`) as any;
    return this.unwrapPayload<ReactionSummaryDTO[]>(response, 'reactions') || [];
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, reaction: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/messages/${messageId}/reactions/${encodeURIComponent(reaction)}`);
  }

  // ============================================================================
  // Attachment endpoints
  // ============================================================================

  /**
   * Send an attachment
   */
  async sendAttachment(
    conversationId: string,
    messageId: string,
    req: SendAttachmentRequest
  ): Promise<AttachmentDTO> {
    const response = await apiClient.post(
      `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}/attachments`,
      req
    ) as any;
    return this.unwrapPayload<AttachmentDTO>(response, 'attachment');
  }

  /**
   * List attachments in a conversation
   */
  async listAttachments(conversationId: string): Promise<AttachmentDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/attachments`) as any;
    return this.unwrapPayload<AttachmentDTO[]>(response, 'attachments') || [];
  }

  // ============================================================================
  // User search for member selection
  // ============================================================================

  /**
   * Search users for adding to groups
   */
  async searchUsers(query: string): Promise<UserOption[]> {
    const response = await apiClient.get(
      `${this.baseUrl}/users`,
      { search: query, page_size: 100 }
    ) as any;
    return this.unwrapPayload<UserOption[]>(response, 'users') || [];
  }

  /**
   * Get all users (for member selection)
   */
  async getAllUsers(): Promise<UserOption[]> {
    const response = await apiClient.get(`${this.baseUrl}/users`, { page_size: 200 }) as any;
    return this.unwrapPayload<UserOption[]>(response, 'users') || [];
  }

  // ============================================================================
  // Real-time SSE subscription
  // ============================================================================

  /**
   * Subscribe to real-time chat events via Server-Sent Events.
   * Returns a cleanup function that closes the connection.
   */
  subscribeToChatEvents(
    onMessage: (event: ChatSSEEvent) => void,
    onError?: (error: Error) => void
  ): () => void {
    const url = this.buildChatStreamUrl();
    const eventSource = new EventSource(url, { withCredentials: true });

    const forwardEvent = (data: string, fallbackType?: string) => {
      try {
        const parsed = JSON.parse(data) as any;

        const dataRoot = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
        const normalized: ChatSSEEvent = {
          type: String(
            dataRoot?.type ||
            parsed?.type ||
            parsed?.event_type ||
            parsed?.event ||
            fallbackType ||
            'message'
          ),
          conversation_id:
            dataRoot?.conversation_id ||
            parsed?.conversation_id ||
            dataRoot?.conversationId ||
            parsed?.conversationId ||
            dataRoot?.message?.conversation_id ||
            parsed?.message?.conversation_id,
          message: dataRoot?.message || parsed?.message,
        };

        if (normalized.type !== 'heartbeat' && normalized.type !== 'connected') {
          onMessage(normalized);
        }
      } catch (err) {
        console.error('Failed to parse chat SSE event:', err);
        onError?.(err as Error);
      }
    };

    eventSource.onmessage = (ev) => {
      forwardEvent(ev.data);
    };

    // Some backends emit named SSE events (event: new_message) instead of default message events.
    const namedEvents = ['new_message', 'message', 'chat_message', 'chat:new_message'];
    const listeners = namedEvents.map((name) => {
      const handler = (ev: Event) => {
        const msgEvent = ev as MessageEvent;
        forwardEvent(String(msgEvent.data || ''), name);
      };
      eventSource.addEventListener(name, handler);
      return { name, handler };
    });

    eventSource.onerror = (err) => {
      console.error('Chat SSE stream error:', err);
      onError?.(new Error('Chat stream connection error'));
    };

    return () => {
      listeners.forEach(({ name, handler }) => {
        eventSource.removeEventListener(name, handler);
      });
      eventSource.close();
    };
  }

  private buildChatStreamUrl(): string {
    const base = resolveApiBaseUrl();
    const url = new URL(`${base}/chat/events`);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) url.searchParams.set('token', token);
    }
    return url.toString();
  }
}

// SSE event shape emitted by the backend /chat/events stream
export interface ChatSSEEvent {
  type: 'new_message' | 'heartbeat' | 'connected' | string;
  conversation_id?: string;
  message?: MessageDTO;
}

// Export singleton instance
export const chatService = new ChatService();
