import { component$, useSignal, useStore, $, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { apiClient } from "~/services";
import type {
  ConversationDTO,
  ParticipantDTO,
  CreateGroupRequest,
  UserOption,
} from "~/types/chat";

// Server-side data loader - returns empty arrays, data loaded client-side
export const useGroupsLoader = routeLoader$(async () => {
  // Return empty data - will be loaded client-side to avoid SSR auth issues
  return { groups: [], users: [] };
});

export default component$(() => {
  const loaderData = useGroupsLoader();

  const groups = useSignal<ConversationDTO[]>(loaderData.value.groups);
  const availableUsers = useSignal<UserOption[]>(loaderData.value.users);
  const initialLoading = useSignal(true);

  // Load data client-side
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async ({ track }) => {
    // Track initialLoading to ensure this runs
    track(() => initialLoading.value);

    console.log('[Chat Admin] useVisibleTask$ started');

    try {
      // Load users first (required for creating groups)
      console.log('[Chat Admin] Fetching users...');
      const usersResponse = await apiClient.get<any>('/admin/users', { limit: 1000 });
      console.log('[Chat Admin] Users response:', usersResponse);

      const usersList = usersResponse.data || usersResponse.users || [];
      console.log('[Chat Admin] Users list count:', usersList.length);

      availableUsers.value = usersList.map((u: any) => ({
        id: u.id || u.ID,
        name: u.name || u.Name,
        email: u.email || u.Email,
        phone: u.phone || u.Phone,
      }));
      console.log('[Chat Admin] Available users set:', availableUsers.value.length);

      // Load conversations (may fail if no chat permissions yet)
      try {
        console.log('[Chat Admin] Fetching conversations...');
        const conversationsResponse = await apiClient.get<any>('/chat/conversations', { type: 'group', page_size: 100 });
        groups.value = conversationsResponse.conversations || [];
        console.log('[Chat Admin] Groups loaded:', groups.value.length);
      } catch (chatError) {
        console.error('[Chat Admin] Error loading conversations:', chatError);
        // Don't fail completely if chat endpoint fails
      }
    } catch (error) {
      console.error('[Chat Admin] Error loading chat data:', error);
    } finally {
      initialLoading.value = false;
      console.log('[Chat Admin] Loading complete');
    }
  }, { strategy: 'document-ready' });

  // UI State
  const showCreateModal = useSignal(false);
  const showDetailsModal = useSignal(false);
  const editingGroup = useSignal<ConversationDTO | null>(null);
  const viewingGroup = useSignal<ConversationDTO | null>(null);
  const loading = useSignal(false);
  const error = useSignal("");
  const success = useSignal("");
  const searchTerm = useSignal("");

  // Form state for creating/editing groups
  const formState = useStore<{
    title: string;
    description: string;
    selectedMembers: string[];
    maxParticipants: number;
  }>({
    title: "",
    description: "",
    selectedMembers: [],
    maxParticipants: 100,
  });

  // Member search
  const memberSearchTerm = useSignal("");

  // Filter groups
  const filteredGroups = groups.value.filter((group) => {
    if (!searchTerm.value) return true;
    const search = searchTerm.value.toLowerCase();
    return (
      group.title?.toLowerCase().includes(search) ||
      group.description?.toLowerCase().includes(search)
    );
  });

  // Filter available users for member selection
  const filteredUsers = availableUsers.value.filter((user) => {
    if (!memberSearchTerm.value) return true;
    const search = memberSearchTerm.value.toLowerCase();
    const name = user.name || '';
    const email = user.email || '';
    return (
      name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search)
    );
  });

  // Reset form
  const resetForm = $(() => {
    formState.title = "";
    formState.description = "";
    formState.selectedMembers = [];
    formState.maxParticipants = 100;
    memberSearchTerm.value = "";
  });

  // Create group handler
  const handleCreateGroup = $(async () => {
    if (!formState.title.trim()) {
      error.value = "Group title is required";
      return;
    }
    if (formState.selectedMembers.length === 0) {
      error.value = "Please select at least one member";
      return;
    }

    loading.value = true;
    error.value = "";

    try {
      const req: CreateGroupRequest = {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        member_ids: formState.selectedMembers,
        max_participants: formState.maxParticipants,
      };

      const result = await apiClient.post<any>('/chat/groups', req);
      const newGroup = result.conversation || result;

      groups.value = [...groups.value, newGroup];
      showCreateModal.value = false;
      await resetForm();
      success.value = "Group created successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Create group error:', err);
      error.value = err?.message || "Failed to create group";
    } finally {
      loading.value = false;
    }
  });

  // Update group handler
  const handleUpdateGroup = $(async () => {
    if (!editingGroup.value) return;

    loading.value = true;
    error.value = "";

    try {
      const result = await apiClient.put<any>(`/chat/conversations/${editingGroup.value.id}`, {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        max_participants: formState.maxParticipants,
      });

      const updatedGroup = result.conversation || result;
      const index = groups.value.findIndex((g) => g.id === editingGroup.value!.id);
      if (index !== -1) {
        const updated = [...groups.value];
        updated[index] = { ...groups.value[index], ...updatedGroup };
        groups.value = updated;
      }

      showCreateModal.value = false;
      editingGroup.value = null;
      await resetForm();
      success.value = "Group updated successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Update group error:', err);
      error.value = err?.message || "Failed to update group";
    } finally {
      loading.value = false;
    }
  });

  // Delete group handler
  const handleDeleteGroup = $(async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return;
    }

    loading.value = true;
    error.value = "";

    try {
      await apiClient.delete(`/chat/conversations/${groupId}`);
      groups.value = groups.value.filter((g) => g.id !== groupId);
      success.value = "Group deleted successfully";
      setTimeout(() => (success.value = ""), 3000);
    } catch (err: any) {
      console.error('Delete group error:', err);
      error.value = err?.message || "Failed to delete group";
    } finally {
      loading.value = false;
    }
  });

  // View group details
  const handleViewDetails = $(async (groupId: string) => {
    try {
      const result = await apiClient.get<any>(`/chat/conversations/${groupId}`);
      viewingGroup.value = result.conversation || result;
      showDetailsModal.value = true;
    } catch (err: any) {
      error.value = err?.message || "Failed to load group details";
    }
  });

  // Open edit modal
  const handleOpenEdit = $((group: ConversationDTO) => {
    editingGroup.value = group;
    formState.title = group.title || "";
    formState.description = group.description || "";
    formState.maxParticipants = group.max_participants || 100;
    formState.selectedMembers = group.participants?.map((p) => p.user_id) || [];
    showCreateModal.value = true;
  });

  // Toggle member selection
  const toggleMember = $((userId: string) => {
    const idx = formState.selectedMembers.indexOf(userId);
    if (idx === -1) {
      formState.selectedMembers = [...formState.selectedMembers, userId];
    } else {
      formState.selectedMembers = formState.selectedMembers.filter((id) => id !== userId);
    }
  });

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <PermissionGuard
      superAdminOnly
      fallback={
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center p-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p class="text-gray-600">You need super admin privileges to manage chat groups.</p>
          </div>
        </div>
      }
    >
      <div class="space-y-6 p-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Chat Groups</h1>
            <p class="text-gray-600 text-sm mt-1">
              Manage chat groups and team communication channels
            </p>
          </div>
          <button
            class="btn btn-primary"
            onClick$={() => {
              editingGroup.value = null;
              resetForm();
              showCreateModal.value = true;
            }}
          >
            <span class="flex items-center gap-2">
              <i class="i-heroicons-plus-solid w-5 h-5 inline-block" />
              Create Group
            </span>
          </button>
        </div>

        {/* Success/Error Messages */}
        {success.value && (
          <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
            <i class="i-heroicons-check-circle-solid w-5 h-5 inline-block" />
            {success.value}
          </div>
        )}
        {error.value && (
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <i class="i-heroicons-exclamation-circle-solid w-5 h-5 inline-block" />
            {error.value}
          </div>
        )}

        {/* Search */}
        <div class="bg-white border rounded-lg p-4">
          <div class="relative">
            <i class="i-heroicons-magnifying-glass-solid w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 inline-block" />
            <input
              type="text"
              class="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search groups by name or description..."
              value={searchTerm.value}
              onInput$={(e) => {
                searchTerm.value = (e.target as HTMLInputElement).value;
              }}
            />
          </div>
        </div>

        {/* Loading */}
        {(loading.value || initialLoading.value) && (
          <div class="flex items-center justify-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Groups Grid */}
        {!loading.value && !initialLoading.value && (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                class="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      {group.avatar_url ? (
                        <img
                          src={group.avatar_url}
                          alt={group.title}
                          class="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <i class="i-heroicons-user-group-solid w-6 h-6 text-blue-600 inline-block" />
                      )}
                    </div>
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900">{group.title || "Unnamed Group"}</h3>
                      <p class="text-sm text-gray-500">
                        {group.participants?.length || 0} members
                      </p>
                    </div>
                  </div>
                  <span
                    class={`px-2 py-1 text-xs rounded ${
                      group.is_archived
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {group.is_archived ? "Archived" : "Active"}
                  </span>
                </div>

                {group.description && (
                  <p class="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                )}

                <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <i class="i-heroicons-calendar-solid w-4 h-4 inline-block" />
                  <span>Created {formatDate(group.created_at)}</span>
                </div>

                {/* Last message preview */}
                {group.last_message && (
                  <div class="bg-gray-50 rounded p-3 mb-4">
                    <p class="text-xs text-gray-500 mb-1">Last message</p>
                    <p class="text-sm text-gray-700 truncate">
                      {group.last_message.content || "No messages yet"}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div class="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    class="btn btn-secondary flex-1"
                    onClick$={() => handleViewDetails(group.id)}
                  >
                    <span class="flex items-center justify-center gap-1">
                      <i class="i-heroicons-eye-solid w-4 h-4 inline-block" />
                      View
                    </span>
                  </button>
                  <button
                    class="btn btn-primary flex-1"
                    onClick$={() => handleOpenEdit(group)}
                  >
                    <span class="flex items-center justify-center gap-1">
                      <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block" />
                      Edit
                    </span>
                  </button>
                  <button
                    class="btn btn-danger"
                    onClick$={() => handleDeleteGroup(group.id)}
                  >
                    <i class="i-heroicons-trash-solid w-4 h-4 inline-block" />
                  </button>
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div class="col-span-full text-center py-12">
                <i class="i-heroicons-chat-bubble-left-right-solid w-12 h-12 text-gray-300 mx-auto mb-4 inline-block" />
                <h3 class="text-lg font-medium text-gray-900 mb-1">No groups found</h3>
                <p class="text-gray-500">
                  {searchTerm.value
                    ? "Try adjusting your search"
                    : "Create your first chat group to get started"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal.value && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div class="p-6 border-b border-gray-200">
                <h3 class="text-lg font-semibold">
                  {editingGroup.value ? "Edit Group" : "Create New Group"}
                </h3>
              </div>

              <div class="p-6 overflow-y-auto flex-1">
                <div class="space-y-4">
                  {/* Group Title */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formState.title}
                      onInput$={(e) => {
                        formState.title = (e.target as HTMLInputElement).value;
                      }}
                      placeholder="e.g., Project Alpha Team"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      value={formState.description}
                      onInput$={(e) => {
                        formState.description = (e.target as HTMLTextAreaElement).value;
                      }}
                      placeholder="What is this group for?"
                    />
                  </div>

                  {/* Max Participants */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formState.maxParticipants}
                      onInput$={(e) => {
                        formState.maxParticipants = parseInt((e.target as HTMLInputElement).value) || 100;
                      }}
                      min={2}
                      max={500}
                    />
                  </div>

                  {/* Member Selection */}
                  {!editingGroup.value && (
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Select Members *
                      </label>
                      <div class="border border-gray-300 rounded-md">
                        {/* Search members */}
                        <div class="p-2 border-b border-gray-200">
                          <div class="relative">
                            <i class="i-heroicons-magnifying-glass-solid w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 inline-block" />
                            <input
                              type="text"
                              class="w-full border border-gray-200 rounded px-8 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                              placeholder="Search users..."
                              value={memberSearchTerm.value}
                              onInput$={(e) => {
                                memberSearchTerm.value = (e.target as HTMLInputElement).value;
                              }}
                            />
                          </div>
                        </div>

                        {/* Selected count */}
                        <div class="px-3 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                          {formState.selectedMembers.length} member(s) selected | {availableUsers.value.length} users available | {filteredUsers.length} filtered
                        </div>

                        {/* User list */}
                        <div class="max-h-48 overflow-y-auto">
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              class={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                formState.selectedMembers.includes(user.id)
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                              onClick$={() => toggleMember(user.id)}
                            >
                              <input
                                type="checkbox"
                                class="rounded border-gray-300 text-blue-600"
                                checked={formState.selectedMembers.includes(user.id)}
                                onChange$={() => {}}
                              />
                              <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900 truncate">
                                  {user.name}
                                </p>
                                <p class="text-xs text-gray-500 truncate">{user.email}</p>
                              </div>
                            </div>
                          ))}
                          {filteredUsers.length === 0 && (
                            <div class="px-3 py-4 text-center text-sm text-gray-500">
                              No users found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  class="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick$={() => {
                    showCreateModal.value = false;
                    editingGroup.value = null;
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  class="btn btn-primary"
                  onClick$={editingGroup.value ? handleUpdateGroup : handleCreateGroup}
                  disabled={loading.value}
                >
                  {loading.value ? (
                    <span class="flex items-center gap-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </span>
                  ) : editingGroup.value ? (
                    "Update Group"
                  ) : (
                    "Create Group"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal.value && viewingGroup.value && (
          <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div class="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div class="p-6 border-b border-gray-200">
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    {viewingGroup.value.avatar_url ? (
                      <img
                        src={viewingGroup.value.avatar_url}
                        alt={viewingGroup.value.title}
                        class="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <i class="i-heroicons-user-group-solid w-8 h-8 text-blue-600 inline-block" />
                    )}
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold">{viewingGroup.value.title}</h3>
                    <p class="text-gray-500">
                      {viewingGroup.value.participants?.length || 0} members
                    </p>
                  </div>
                </div>
              </div>

              <div class="p-6 overflow-y-auto flex-1">
                <div class="space-y-6">
                  {/* Group Info */}
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500">Created</label>
                      <p class="text-gray-900">{formatDate(viewingGroup.value.created_at)}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500">Status</label>
                      <p>
                        <span
                          class={`px-2 py-1 text-xs rounded ${
                            viewingGroup.value.is_archived
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {viewingGroup.value.is_archived ? "Archived" : "Active"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500">Max Participants</label>
                      <p class="text-gray-900">{viewingGroup.value.max_participants}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500">Unread Messages</label>
                      <p class="text-gray-900">{viewingGroup.value.unread_count || 0}</p>
                    </div>
                  </div>

                  {viewingGroup.value.description && (
                    <div>
                      <label class="text-sm font-medium text-gray-500">Description</label>
                      <p class="text-gray-900 mt-1">{viewingGroup.value.description}</p>
                    </div>
                  )}

                  {/* Members */}
                  <div>
                    <label class="text-sm font-medium text-gray-500 block mb-3">
                      Members ({viewingGroup.value.participants?.length || 0})
                    </label>
                    <div class="border rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {viewingGroup.value.participants?.map((participant: ParticipantDTO) => (
                        <div
                          key={participant.user_id}
                          class="flex items-center justify-between px-4 py-3"
                        >
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <i class="i-heroicons-user-solid w-5 h-5 text-gray-500 inline-block" />
                            </div>
                            <div>
                              <p class="text-sm font-medium text-gray-900">
                                {participant.user_name || "Unknown User"}
                              </p>
                              <p class="text-xs text-gray-500">
                                {participant.user_email || participant.user_id}
                              </p>
                            </div>
                          </div>
                          <span
                            class={`px-2 py-1 text-xs rounded ${
                              participant.role === "owner"
                                ? "bg-purple-100 text-purple-800"
                                : participant.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {participant.role}
                          </span>
                        </div>
                      ))}
                      {(!viewingGroup.value.participants ||
                        viewingGroup.value.participants.length === 0) && (
                        <div class="px-4 py-8 text-center text-gray-500">
                          No members in this group
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div class="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  class="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                  onClick$={() => {
                    showDetailsModal.value = false;
                    viewingGroup.value = null;
                  }}
                >
                  Close
                </button>
                <button
                  class="btn btn-primary"
                  onClick$={() => {
                    if (viewingGroup.value) {
                      handleOpenEdit(viewingGroup.value);
                      showDetailsModal.value = false;
                      viewingGroup.value = null;
                    }
                  }}
                >
                  Edit Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
});
