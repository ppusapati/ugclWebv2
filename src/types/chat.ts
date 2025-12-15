// Chat system types for frontend

export type ConversationType = 'direct' | 'group' | 'channel';

export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio' | 'location' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';

export type ParticipantRole = 'owner' | 'admin' | 'moderator' | 'member';

// Participant DTO
export interface ParticipantDTO {
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  left_at?: string;
  last_read_message_id?: string;
  last_read_at?: string;
  notifications_enabled: boolean;
  mention_notifications_only: boolean;
  is_muted: boolean;
  muted_until?: string;
  user_name?: string;
  user_email?: string;
}

// Message DTO
export interface MessageDTO {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  status: MessageStatus;
  reply_to_id?: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  delivered_at?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  attachments?: AttachmentDTO[];
  reactions?: ReactionSummaryDTO[];
  read_count?: number;
}

// Attachment DTO
export interface AttachmentDTO {
  id: string;
  message_id: string;
  dms_file_id?: string;
  dms_file_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Reaction Summary DTO
export interface ReactionSummaryDTO {
  reaction: string;
  count: number;
  user_ids: string[];
}

// Conversation DTO
export interface ConversationDTO {
  id: string;
  type: ConversationType;
  title?: string;
  description?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
  last_message_id?: string;
  last_message_at?: string;
  is_muted: boolean;
  is_archived: boolean;
  max_participants: number;
  created_by: string;
  created_at: string;
  unread_count?: number;
  last_message?: MessageDTO;
  participants?: ParticipantDTO[];
  other_participant?: ParticipantDTO; // For direct conversations
}

// Request types
export interface CreateConversationRequest {
  type: ConversationType;
  title?: string;
  description?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
  participant_ids?: string[];
  participant_user_ids?: string[];
  max_participants?: number;
}

export interface CreateGroupRequest {
  title: string;
  description?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
  member_ids: string[];
  max_participants?: number;
}

export interface SendMessageRequest {
  content: string;
  message_type?: MessageType;
  reply_to_id?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface UpdateConversationRequest {
  title?: string;
  description?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
  max_participants?: number;
}

export interface AddParticipantRequest {
  user_id: string;
  role?: ParticipantRole;
}

export interface UpdateParticipantRoleRequest {
  role: ParticipantRole;
}

export interface AddReactionRequest {
  reaction: string;
}

// Response types
export interface ConversationListResponse {
  conversations: ConversationDTO[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface MessageListResponse {
  messages: MessageDTO[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ParticipantListResponse {
  participants: ParticipantDTO[];
  total_count: number;
}

// Filter types
export interface ConversationFilters {
  type?: ConversationType;
  include_archived?: boolean;
  page?: number;
  page_size?: number;
}

export interface MessageFilters {
  before?: string; // ISO date
  after?: string; // ISO date
  page?: number;
  page_size?: number;
}

// User for member selection
export interface UserOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}
