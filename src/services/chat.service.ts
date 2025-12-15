import { apiClient } from './api-client';
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

  // ============================================================================
  // Conversation endpoints
  // ============================================================================

  /**
   * Create a new conversation
   */
  async createConversation(req: CreateConversationRequest): Promise<ConversationDTO> {
    const response = await apiClient.post(`${this.baseUrl}/conversations`, req) as any;
    return response.data.conversation;
  }

  /**
   * Create a new group (admin only)
   */
  async createGroup(req: CreateGroupRequest): Promise<ConversationDTO> {
    const response = await apiClient.post(`${this.baseUrl}/groups`, req) as any;
    return response.data.conversation;
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
    return response.data;
  }

  /**
   * Get a specific conversation
   */
  async getConversation(id: string): Promise<ConversationDTO> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${id}`) as any;
    return response.data.conversation;
  }

  /**
   * Update a conversation
   */
  async updateConversation(id: string, req: UpdateConversationRequest): Promise<ConversationDTO> {
    const response = await apiClient.put(`${this.baseUrl}/conversations/${id}`, req) as any;
    return response.data.conversation;
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
    return response.data.message;
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
    return response.data;
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
    return response.data;
  }

  /**
   * Get a specific message
   */
  async getMessage(id: string): Promise<MessageDTO> {
    const response = await apiClient.get(`${this.baseUrl}/messages/${id}`) as any;
    return response.data.message;
  }

  /**
   * Update a message
   */
  async updateMessage(id: string, req: UpdateMessageRequest): Promise<MessageDTO> {
    const response = await apiClient.put(`${this.baseUrl}/messages/${id}`, req) as any;
    return response.data.message;
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
    return response.data.participant;
  }

  /**
   * List participants in a conversation
   */
  async listParticipants(conversationId: string): Promise<ParticipantListResponse> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/participants`) as any;
    return response.data;
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
  async markAsRead(conversationId: string, messageId?: string): Promise<void> {
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
    return response.data.users || [];
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
    return response.data.reactions || [];
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
  async sendAttachment(conversationId: string, messageId: string, formData: FormData): Promise<AttachmentDTO> {
    const response = await apiClient.post(
      `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}/attachments`,
      formData
    ) as any;
    return response.data.attachment;
  }

  /**
   * List attachments in a conversation
   */
  async listAttachments(conversationId: string): Promise<AttachmentDTO[]> {
    const response = await apiClient.get(`${this.baseUrl}/conversations/${conversationId}/attachments`) as any;
    return response.data.attachments || [];
  }

  // ============================================================================
  // User search for member selection
  // ============================================================================

  /**
   * Search users for adding to groups
   */
  async searchUsers(query: string): Promise<UserOption[]> {
    const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`) as any;
    return response.data.users || [];
  }

  /**
   * Get all users (for member selection)
   */
  async getAllUsers(): Promise<UserOption[]> {
    const response = await apiClient.get('/users') as any;
    return response.data.users || [];
  }
}

// Export singleton instance
export const chatService = new ChatService();
