import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import PermissionGuard from "~/components/auth/PermissionGuard";

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
  user_id: string;
  site_id: string;
  business_vertical_id: string;
  assigned_at: string;
  assigned_by?: string;
  site?: Site;
}

interface User {
  id: string;
  name: string;
  email: string;
}

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

  const API_BASE_URL = "http://localhost:8080/api/v1";
  const API_KEY = "87339ea3-1add-4689-ae57-3128ebd03c4f";

  const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-api-key": API_KEY,
    };
  };

  // Load initial data
  useVisibleTask$(async () => {
    try {
      const [userRes, verticalsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          headers: getHeaders(),
        }),
        fetch(`${API_BASE_URL}/admin/businesses`, { headers: getHeaders() }),
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
  useVisibleTask$(({ track }) => {
    track(() => state.selectedVertical);

    const loadSites = async () => {
      if (!state.selectedVertical) {
        state.allSites = [];
        state.assignedSites = [];
        state.availableSites = [];
        return;
      }

      try {
        const [allSitesRes, assignedSitesRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/business/${state.selectedVertical}/sites`,
            {
              headers: getHeaders(),
            }
          ),
          fetch(
            `${API_BASE_URL}/business/${state.selectedVertical}/sites/user/${userId}/access`,
            {
              headers: getHeaders(),
            }
          ),
        ]);

        if (allSitesRes.ok) {
          const sitesData = await allSitesRes.json();
          state.allSites = sitesData.sites || sitesData.data || [];
        }

        if (assignedSitesRes.ok) {
          const assignedData = await assignedSitesRes.json();
          state.assignedSites = assignedData.access || assignedData.data || [];
        }

        // Calculate available sites (sites not yet assigned)
        const assignedSiteIds = state.assignedSites.map((a) => a.site_id);
        state.availableSites = state.allSites.filter(
          (site) => !assignedSiteIds.includes(site.id)
        );
      } catch (error) {
        console.error("Failed to load sites:", error);
        state.error = "Failed to load sites for this vertical";
      }
    };

    if (state.selectedVertical) {
      loadSites();
    }
  });

  // Assign sites (move from available to assigned)
  const handleAssignSites = $(async () => {
    if (state.selectedAvailable.length === 0) {
      state.error = "Please select sites to assign";
      return;
    }

    try {
      const vertical = state.businessVerticals.find(
        (v) => v.code === state.selectedVertical
      );
      if (!vertical) return;

      const response = await fetch(
        `${API_BASE_URL}/business/${state.selectedVertical}/sites/access`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            user_id: userId,
            site_ids: state.selectedAvailable,
            business_vertical_id: vertical.id,
          }),
        }
      );

      if (response.ok) {
        state.success = `${state.selectedAvailable.length} site(s) assigned successfully`;
        state.selectedAvailable = [];
        setTimeout(() => (state.success = ""), 3000);

        // Reload sites
        const [allSitesRes, assignedSitesRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/business/${state.selectedVertical}/sites`,
            {
              headers: getHeaders(),
            }
          ),
          fetch(
            `${API_BASE_URL}/business/${state.selectedVertical}/sites/user/${userId}/access`,
            {
              headers: getHeaders(),
            }
          ),
        ]);

        if (allSitesRes.ok) {
          const sitesData = await allSitesRes.json();
          state.allSites = sitesData.sites || sitesData.data || [];
        }

        if (assignedSitesRes.ok) {
          const assignedData = await assignedSitesRes.json();
          state.assignedSites = assignedData.access || assignedData.data || [];
        }

        const assignedSiteIds = state.assignedSites.map((a) => a.site_id);
        state.availableSites = state.allSites.filter(
          (site) => !assignedSiteIds.includes(site.id)
        );
      } else {
        const errorData = await response.json();
        state.error = errorData.error || "Failed to assign sites";
      }
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
            headers: getHeaders(),
          }
        )
      );

      const results = await Promise.all(revokePromises);
      const allSuccess = results.every((r) => r.ok);

      if (allSuccess) {
        state.success = `${state.selectedAssigned.length} site(s) revoked successfully`;
        state.selectedAssigned = [];
        setTimeout(() => (state.success = ""), 3000);

        // Reload sites
        const [allSitesRes, assignedSitesRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/business/${state.selectedVertical}/sites`,
            {
              headers: getHeaders(),
            }
          ),
          fetch(
            `${API_BASE_URL}/business/${state.selectedVertical}/sites/user/${userId}/access`,
            {
              headers: getHeaders(),
            }
          ),
        ]);

        if (allSitesRes.ok) {
          const sitesData = await allSitesRes.json();
          state.allSites = sitesData.sites || sitesData.data || [];
        }

        if (assignedSitesRes.ok) {
          const assignedData = await assignedSitesRes.json();
          state.assignedSites = assignedData.access || assignedData.data || [];
        }

        const assignedSiteIds = state.assignedSites.map((a) => a.site_id);
        state.availableSites = state.allSites.filter(
          (site) => !assignedSiteIds.includes(site.id)
        );
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
      const site = state.allSites.find((s) => s.id === access.site_id);
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
    const site = state.allSites.find((s) => s.id === access.site_id);
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
              onClick$={() => nav("/admin/users")}
            >
              ← Back to Users
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
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Business Vertical
          </label>
          <select
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
                    <button
                      class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      onClick$={selectAllAvailable}
                    >
                      Select All
                    </button>
                    <button
                      class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      onClick$={selectNoneAvailable}
                    >
                      Select None
                    </button>
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
                    <button
                      class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      onClick$={selectAllAssigned}
                    >
                      Select All
                    </button>
                    <button
                      class="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      onClick$={selectNoneAssigned}
                    >
                      Select None
                    </button>
                  </div>
                  <div class="border rounded max-h-96 overflow-y-auto">
                    {filteredAssigned.length > 0 ? (
                      filteredAssigned.map((access) => {
                        const site = state.allSites.find(
                          (s) => s.id === access.site_id
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
                                {new Date(access.assigned_at).toLocaleDateString()}
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
              <button
                class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={state.selectedAvailable.length === 0}
                onClick$={handleAssignSites}
              >
                <span>→</span>
                Assign Selected ({state.selectedAvailable.length})
              </button>
              <button
                class="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={state.selectedAssigned.length === 0}
                onClick$={handleRevokeSites}
              >
                <span>←</span>
                Revoke Selected ({state.selectedAssigned.length})
              </button>
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
