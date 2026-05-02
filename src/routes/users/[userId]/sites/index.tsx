/* eslint-disable @typescript-eslint/no-unused-vars */
import { component$, useStore, useTask$, $, isServer } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";
import { resolveApiBaseUrl } from '~/config/api';
import { Btn, FormField } from '~/components/ds';

interface BusinessVertical {
  id: string;
  name: string;
  code: string;
}

interface Site {
  id: string;
  name: string;
  code: string;
  business_vertical_id: string;
  location?: string;
  is_active: boolean;
}

interface UserSiteAccess {
  id: string;
  userId?: string;
  siteId: string;
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  assignedAt?: string;
  assignedBy?: string;
  site?: Site;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const API_KEY = "87339ea3-1add-4689-ae57-3128ebd03c4f";

const buildHeaders = () => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? ""}`,
    "x-api-key": API_KEY,
  };
};

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const userId = location.params.userId;

  const state = useStore({
    user: null as User | null,
    businessVerticals: [] as BusinessVertical[],
    selectedVertical: "",
    allSites: [] as Site[],
    assignedSites: [] as UserSiteAccess[],
    availableSites: [] as Site[],
    selectedAvailable: [] as string[],
    selectedAssigned: [] as string[],
    searchAvailable: "",
    searchAssigned: "",
    loading: true,
    error: "",
    success: "",
  });

  const API_BASE_URL = resolveApiBaseUrl();

  const loadSitesForVertical = $(async (verticalCode: string) => {
    if (!verticalCode) {
      state.allSites = [];
      state.assignedSites = [];
      state.availableSites = [];
      return;
    }

    const [allSitesRes, assignedSitesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/business/${verticalCode}/sites`, {
        headers: buildHeaders(),
      }),
      fetch(`${API_BASE_URL}/business/${verticalCode}/sites/user/${userId}/access`, {
        headers: buildHeaders(),
      }),
    ]);

    if (!allSitesRes.ok) {
      throw new Error("failed to fetch sites");
    }

    const allSitesPayload = await allSitesRes.json();
    state.allSites = allSitesPayload.sites || allSitesPayload.data || [];

    if (!assignedSitesRes.ok) {
      throw new Error("failed to fetch assigned sites");
    }

    const assignedPayload = await assignedSitesRes.json();
    const assignedRecords = assignedPayload.access || assignedPayload.data || [];
    state.assignedSites = assignedRecords.map((item: any) => ({
      id: item.id,
      userId: item.userId || item.user_id,
      siteId: item.siteId || item.site_id,
      canRead: item.canRead ?? item.can_read,
      canCreate: item.canCreate ?? item.can_create,
      canUpdate: item.canUpdate ?? item.can_update,
      canDelete: item.canDelete ?? item.can_delete,
      assignedAt: item.assignedAt || item.assigned_at,
      assignedBy: item.assignedBy || item.assigned_by,
      site: item.site,
    }));

    const assignedSiteIds = new Set(state.assignedSites.map((a) => a.siteId));
    state.availableSites = state.allSites.filter((site) => !assignedSiteIds.has(site.id));
  });

  // Load initial data
  useTask$(async () => {
    if (isServer) return;
    try {
      const [userRes, verticalsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          headers: buildHeaders(),
        }),
        fetch(`${API_BASE_URL}/admin/businesses`, { headers: buildHeaders() }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        state.user = userData.user || userData;
      }

      if (verticalsRes.ok) {
        const verticalsData = await verticalsRes.json();
        state.businessVerticals =
          verticalsData.businesses || verticalsData.data || [];

        // Auto-select first vertical if available
        if (state.businessVerticals.length > 0) {
          state.selectedVertical = state.businessVerticals[0].code;
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      state.error = "Network error occurred";
    } finally {
      state.loading = false;
    }
  });

  // Load sites when vertical is selected
  useTask$(({ track }) => {
    if (isServer) return;
    track(() => state.selectedVertical);

    const syncSites = async () => {
      try {
        await loadSitesForVertical(state.selectedVertical);
      } catch (error) {
        console.error("Failed to load sites:", error);
        state.error = "Failed to load sites for this vertical";
      }
    };

    syncSites();
  });

  // Assign sites (move from available to assigned)
  const handleAssignSites = $(async () => {
    if (state.selectedAvailable.length === 0) {
      state.error = "Please select sites to assign";
      return;
    }

    try {
      const responses = await Promise.all(
        state.selectedAvailable.map((siteId) =>
          fetch(`${API_BASE_URL}/business/${state.selectedVertical}/sites/access`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({
              userId,
              siteId,
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: false,
            }),
          })
        )
      );

      const failed = responses.filter((response) => !response.ok);
      if (failed.length > 0) {
        const firstError = await failed[0].text();
        state.error = firstError || "Failed to assign some selected sites";
        return;
      }

      state.success = `${state.selectedAvailable.length} site(s) assigned successfully`;
      state.selectedAvailable = [];
      setTimeout(() => (state.success = ""), 3000);
      await loadSitesForVertical(state.selectedVertical);
    } catch (error) {
      state.error = "Network error occurred";
    }
  });

  // Revoke sites (move from assigned to available)
  const handleRevokeSites = $(async () => {
    if (state.selectedAssigned.length === 0) {
      state.error = "Please select sites to revoke";
      return;
    }

    if (
      !confirm(
        `Are you sure you want to revoke access to ${state.selectedAssigned.length} site(s)?`
      )
    )
      return;

    try {
      const revokePromises = state.selectedAssigned.map((accessId) =>
        fetch(
          `${API_BASE_URL}/business/${state.selectedVertical}/sites/access/${accessId}`,
          {
            method: "DELETE",
            headers: buildHeaders(),
          }
        )
      );

      const results = await Promise.all(revokePromises);
      const allSuccess = results.every((r) => r.ok);

      if (allSuccess) {
        state.success = `${state.selectedAssigned.length} site(s) revoked successfully`;
        state.selectedAssigned = [];
        setTimeout(() => (state.success = ""), 3000);
        await loadSitesForVertical(state.selectedVertical);
      } else {
        state.error = "Failed to revoke some sites";
      }
    } catch (error) {
      state.error = "Network error occurred";
    }
  });

  // Toggle site selection
  const toggleAvailableSite = $((siteId: string) => {
    const index = state.selectedAvailable.indexOf(siteId);
    if (index > -1) {
      state.selectedAvailable.splice(index, 1);
    } else {
      state.selectedAvailable.push(siteId);
    }
  });

  const toggleAssignedSite = $((accessId: string) => {
    const index = state.selectedAssigned.indexOf(accessId);
    if (index > -1) {
      state.selectedAssigned.splice(index, 1);
    } else {
      state.selectedAssigned.push(accessId);
    }
  });

  // Select all/none
  const selectAllAvailable = $(() => {
    const filtered = state.availableSites.filter((site) =>
      site.name.toLowerCase().includes(state.searchAvailable.toLowerCase())
    );
    state.selectedAvailable = filtered.map((s) => s.id);
  });

  const selectNoneAvailable = $(() => {
    state.selectedAvailable = [];
  });

  const selectAllAssigned = $(() => {
    const filtered = state.assignedSites.filter((access) => {
      const site = state.allSites.find((s) => s.id === access.siteId);
      return (
        site &&
        site.name.toLowerCase().includes(state.searchAssigned.toLowerCase())
      );
    });
    state.selectedAssigned = filtered.map((a) => a.id);
  });

  const selectNoneAssigned = $(() => {
    state.selectedAssigned = [];
  });

  if (state.loading) {
    return (
      <PermissionGuard superAdminOnly>
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PermissionGuard>
    );
  }

  if (!state.user) {
    return (
      <PermissionGuard superAdminOnly>
        <div class="p-6">
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            User not found
          </div>
        </div>
      </PermissionGuard>
    );
  }

  const filteredAvailable = state.availableSites.filter((site) =>
    site.name.toLowerCase().includes(state.searchAvailable.toLowerCase())
  );

  const filteredAssigned = state.assignedSites.filter((access) => {
    const site = state.allSites.find((s) => s.id === access.siteId);
    return (
      site &&
      site.name.toLowerCase().includes(state.searchAssigned.toLowerCase())
    );
  });

  return (
    <PermissionGuard superAdminOnly>
      <div class="space-y-6 p-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <button
              class="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              onClick$={() => nav("/users")}
            >
              <i class="i-heroicons-arrow-left-solid mr-1 h-4 w-4 inline-block" aria-hidden="true"></i>
              Back to Users
            </button>
            <h1 class="text-2xl font-bold">Site Assignment</h1>
            <p class="text-gray-600 text-sm mt-1">
              Managing site access for: <strong>{state.user.name}</strong> (
              {state.user.email})
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {state.success && (
          <div class="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {state.success}
          </div>
        )}
        {state.error && (
          <div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {state.error}
          </div>
        )}

        {/* Vertical Filter */}
        <div class="bg-white border rounded-lg p-4">
          <FormField id="user-sites-vertical" label="Business Vertical">
            <select
              id="user-sites-vertical"
              class="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={state.selectedVertical}
              onChange$={(e) => {
                state.selectedVertical = (e.target as HTMLSelectElement).value;
                state.selectedAvailable = [];
                state.selectedAssigned = [];
              }}
            >
              <option value="">Select a vertical</option>
              {state.businessVerticals.map((vertical) => (
                <option key={vertical.id} value={vertical.code}>
                  {vertical.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {state.selectedVertical && (
          <div class="bg-white border rounded-lg p-6 shadow">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Sites */}
              <div class="border rounded-lg">
                <div class="bg-gray-50 px-4 py-3 border-b">
                  <h3 class="font-semibold">
                    Available Sites ({filteredAvailable.length})
                  </h3>
                  <p class="text-xs text-gray-600">
                    Sites not yet assigned to this user
                  </p>
                </div>
                <div class="p-4">
                  <input
                    type="text"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search available sites..."
                    value={state.searchAvailable}
                    onInput$={(e) => {
                      state.searchAvailable = (
                        e.target as HTMLInputElement
                      ).value;
                    }}
                  />
                  <div class="flex gap-2 mb-3">
                    <Btn
                      size="sm"
                      variant="secondary"
                      class="rounded"
                      onClick$={selectAllAvailable}
                    >
                      Select All
                    </Btn>
                    <Btn
                      size="sm"
                      variant="secondary"
                      class="rounded"
                      onClick$={selectNoneAvailable}
                    >
                      Select None
                    </Btn>
                  </div>
                  <div class="border rounded max-h-96 overflow-y-auto">
                    {filteredAvailable.length > 0 ? (
                      filteredAvailable.map((site) => (
                        <label
                          key={site.id}
                          class="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            checked={state.selectedAvailable.includes(site.id)}
                            onChange$={() => toggleAvailableSite(site.id)}
                          />
                          <div class="ml-3 flex-1">
                            <div class="text-sm font-medium text-gray-900">
                              {site.name}
                            </div>
                            <div class="text-xs text-gray-500">
                              Code: {site.code}
                              {site.location && ` • ${site.location}`}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div class="p-8 text-center text-gray-500 text-sm">
                        {state.searchAvailable
                          ? "No sites match your search"
                          : "All sites are already assigned"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Sites */}
              <div class="border rounded-lg">
                <div class="bg-gray-50 px-4 py-3 border-b">
                  <h3 class="font-semibold">
                    Assigned Sites ({filteredAssigned.length})
                  </h3>
                  <p class="text-xs text-gray-600">
                    Sites this user can access
                  </p>
                </div>
                <div class="p-4">
                  <input
                    type="text"
                    class="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search assigned sites..."
                    value={state.searchAssigned}
                    onInput$={(e) => {
                      state.searchAssigned = (
                        e.target as HTMLInputElement
                      ).value;
                    }}
                  />
                  <div class="flex gap-2 mb-3">
                    <Btn
                      size="sm"
                      variant="secondary"
                      class="rounded"
                      onClick$={selectAllAssigned}
                    >
                      Select All
                    </Btn>
                    <Btn
                      size="sm"
                      variant="secondary"
                      class="rounded"
                      onClick$={selectNoneAssigned}
                    >
                      Select None
                    </Btn>
                  </div>
                  <div class="border rounded max-h-96 overflow-y-auto">
                    {filteredAssigned.length > 0 ? (
                      filteredAssigned.map((access) => {
                        const site = state.allSites.find(
                          (s) => s.id === access.siteId
                        );
                        if (!site) return null;

                        return (
                          <label
                            key={access.id}
                            class="flex items-center p-3 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={state.selectedAssigned.includes(
                                access.id
                              )}
                              onChange$={() => toggleAssignedSite(access.id)}
                            />
                            <div class="ml-3 flex-1">
                              <div class="text-sm font-medium text-gray-900">
                                {site.name}
                              </div>
                              <div class="text-xs text-gray-500">
                                Code: {site.code}
                                {site.location && ` • ${site.location}`}
                              </div>
                              <div class="text-xs text-gray-400 mt-1">
                                Assigned:{" "}
                                {access.assignedAt ? new Date(access.assignedAt).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div class="p-8 text-center text-gray-500 text-sm">
                        {state.searchAssigned
                          ? "No sites match your search"
                          : "No sites assigned yet"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div class="flex justify-center gap-4 mt-6">
              <Btn
                class="rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={state.selectedAvailable.length === 0}
                onClick$={handleAssignSites}
              >
                <i class="i-heroicons-arrow-right-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Assign Selected ({state.selectedAvailable.length})
              </Btn>
              <Btn
                variant="danger"
                class="rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={state.selectedAssigned.length === 0}
                onClick$={handleRevokeSites}
              >
                <i class="i-heroicons-arrow-left-solid h-4 w-4 inline-block" aria-hidden="true"></i>
                Revoke Selected ({state.selectedAssigned.length})
              </Btn>
            </div>
          </div>
        )}

        {!state.selectedVertical && (
          <div class="bg-white border rounded-lg p-12 text-center text-gray-500">
            Please select a business vertical to manage site assignments
          </div>
        )}
      </div>
    </PermissionGuard>
  );
});
