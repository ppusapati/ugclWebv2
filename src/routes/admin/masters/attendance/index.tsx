import { $, component$, isServer, useSignal, useTask$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { attendanceService } from '~/services';
import type {
  AttendanceHeadcountSite,
  AttendanceSession,
} from '~/services';

function formatDateTime(value?: string): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function minutesSince(value?: string): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  return `${mins} min`;
}

function parseAnomalyFlags(raw?: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function resolveCurrentBusinessCode(): string {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return '';

    const user = JSON.parse(userStr);
    const storedBusinessId = localStorage.getItem('ugcl_current_business_vertical');
    const businessRoles = Array.isArray(user.business_roles) ? user.business_roles : [];
    const currentBusiness =
      businessRoles.find((role: any) => role.business_vertical_id === storedBusinessId) ||
      businessRoles[0];

    return currentBusiness?.business_vertical?.code || '';
  } catch {
    return '';
  }
}

export default component$(() => {
  const nav = useNavigate();
  const businessCode = useSignal('');
  const loading = useSignal(true);
  const refreshing = useSignal(false);
  const error = useSignal('');

  const activeSessions = useSignal<AttendanceSession[]>([]);
  const attendanceLogs = useSignal<AttendanceSession[]>([]);
  const headcountBySite = useSignal<AttendanceHeadcountSite[]>([]);
  const totalActive = useSignal(0);

  const selectedUserId = useSignal('');
  const selectedUserName = useSignal('');
  const timelineSessions = useSignal<AttendanceSession[]>([]);
  const timelineLoading = useSignal(false);
  const timelineError = useSignal('');

  const loadDashboard = $(async () => {
    if (!businessCode.value) {
      loading.value = false;
      error.value = 'No active business selected. Please select a business vertical first.';
      return;
    }

    try {
      error.value = '';
      const [activeRes, logRes, headcountRes] = await Promise.all([
        attendanceService.getActiveSessions(businessCode.value, { page: 1, limit: 100 }),
        attendanceService.getLogs(businessCode.value, { page: 1, limit: 100 }),
        attendanceService.getHeadcount(businessCode.value),
      ]);

      activeSessions.value = activeRes.data || [];
      attendanceLogs.value = logRes.data || [];
      headcountBySite.value = headcountRes.sites || [];
      totalActive.value = headcountRes.totalActive || 0;
    } catch (err: any) {
      error.value = err.message || 'Failed to load attendance monitoring data';
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  });

  const refreshDashboard = $(async () => {
    refreshing.value = true;
    await loadDashboard();
  });

  const loadTimeline = $(async (userId: string, userName: string) => {
    if (!businessCode.value) return;

    selectedUserId.value = userId;
    selectedUserName.value = userName;
    timelineError.value = '';
    timelineLoading.value = true;

    try {
      const response = await attendanceService.getEmployeeTimeline(businessCode.value, userId, {
        to: new Date().toISOString(),
      });
      timelineSessions.value = response.data || [];
    } catch (err: any) {
      timelineError.value = err.message || 'Failed to load employee timeline';
      timelineSessions.value = [];
    } finally {
      timelineLoading.value = false;
    }
  });

  useTask$(async () => {
    if (isServer) {
      return;
    }

    businessCode.value = resolveCurrentBusinessCode();
    await loadDashboard();
  });

  const flaggedActiveCount = activeSessions.value.filter(
    (session) => session.validationStatus === 'flagged'
  ).length;

  if (loading.value) {
    return (
      <div class="min-h-screen bg-light-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-dark-600">Loading attendance monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-light-50 py-8 px-4">
      <div class="container-lg mx-auto space-y-6">
        <div class="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 class="text-3xl font-bold text-dark-800">Attendance Monitoring</h1>
            <p class="text-dark-600 mt-2">
              Live tracking and attendance audit for <span class="font-semibold">{businessCode.value || 'current business'}</span>
            </p>
          </div>

          <div class="flex gap-3">
            <button
              onClick$={() => nav('/admin/masters/sites')}
              class="btn-light-300 px-4 py-2 rounded-lg font-semibold"
            >
              Sites
            </button>
            <button
              onClick$={refreshDashboard}
              disabled={refreshing.value}
              class="btn-primary px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {refreshing.value ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error.value && (
          <div class="alert-danger rounded-lg p-4 bg-danger-50 border-l-4 border-danger-500">
            <p class="text-danger-800">{error.value}</p>
          </div>
        )}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card bg-white shadow rounded-lg p-5">
            <div class="text-sm text-dark-600">Active Workers</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">{totalActive.value}</div>
          </div>
          <div class="card bg-white shadow rounded-lg p-5">
            <div class="text-sm text-dark-600">Flagged Active</div>
            <div class="text-3xl font-bold text-warning-600 mt-2">{flaggedActiveCount}</div>
          </div>
          <div class="card bg-white shadow rounded-lg p-5">
            <div class="text-sm text-dark-600">Sites With Presence</div>
            <div class="text-3xl font-bold text-info-600 mt-2">{headcountBySite.value.length}</div>
          </div>
          <div class="card bg-white shadow rounded-lg p-5">
            <div class="text-sm text-dark-600">Recent Sessions</div>
            <div class="text-3xl font-bold text-success-600 mt-2">{attendanceLogs.value.length}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="card bg-white shadow-lg rounded-xl p-6 lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-dark-800">Live Sessions</h2>
              <span class="text-xs text-dark-500">{activeSessions.value.length} active</span>
            </div>

            {activeSessions.value.length === 0 ? (
              <div class="text-center py-10 text-dark-500">No active attendance sessions right now.</div>
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-light-200">
                  <thead class="bg-light-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Worker</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Site</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Status</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Last Seen</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-dark-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-light-200">
                    {activeSessions.value.map((session) => {
                      const anomalyFlags = parseAnomalyFlags(session.anomalyFlags);
                      const workerName = session.user?.name || session.userId;

                      return (
                        <tr key={session.id} class="hover:bg-light-50 transition">
                          <td class="px-4 py-3">
                            <div class="text-sm font-semibold text-dark-800">{workerName}</div>
                            <div class="text-xs text-dark-500">{session.user?.phone || '-'}</div>
                          </td>
                          <td class="px-4 py-3 text-sm text-dark-700">{session.site?.name || session.siteId}</td>
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-2 flex-wrap">
                              {session.validationStatus === 'flagged' ? (
                                <span class="badge-warning">Flagged</span>
                              ) : (
                                <span class="badge-success">Accepted</span>
                              )}
                              {anomalyFlags.length > 0 && (
                                <span class="text-xs text-warning-700">{anomalyFlags.join(', ')}</span>
                              )}
                            </div>
                          </td>
                          <td class="px-4 py-3 text-sm text-dark-700">
                            <div>{formatDateTime(session.lastSeenAt)}</div>
                            <div class="text-xs text-dark-500">{minutesSince(session.lastSeenAt)} ago</div>
                          </td>
                          <td class="px-4 py-3 text-right">
                            <button
                              onClick$={() => loadTimeline(session.userId, workerName)}
                              class="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                            >
                              Timeline
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div class="card bg-white shadow-lg rounded-xl p-6">
            <h2 class="text-xl font-bold text-dark-800 mb-4">Headcount by Site</h2>

            {headcountBySite.value.length === 0 ? (
              <div class="text-dark-500 text-sm">No active headcount data.</div>
            ) : (
              <div class="space-y-3">
                {headcountBySite.value.map((item) => (
                  <div key={item.siteId} class="rounded-lg border border-light-200 p-4">
                    <div class="flex justify-between items-start gap-2">
                      <div>
                        <div class="font-semibold text-dark-800">{item.siteName}</div>
                        <div class="text-xs text-dark-500">Last seen: {formatDateTime(item.lastSeenAt)}</div>
                      </div>
                      <span class="badge-info">{item.activeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div class="card bg-white shadow-lg rounded-xl p-6">
          <h2 class="text-xl font-bold text-dark-800 mb-4">Recent Attendance Logs</h2>

          {attendanceLogs.value.length === 0 ? (
            <div class="text-dark-500 text-sm">No attendance logs found.</div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-light-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Worker</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Site</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Check-In</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Check-Out</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-dark-700 uppercase">Validation</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {attendanceLogs.value.map((session) => {
                    const anomalyFlags = parseAnomalyFlags(session.anomalyFlags);

                    return (
                      <tr key={session.id} class="hover:bg-light-50 transition">
                        <td class="px-4 py-3 text-sm text-dark-800">{session.user?.name || session.userId}</td>
                        <td class="px-4 py-3 text-sm text-dark-700">{session.site?.name || session.siteId}</td>
                        <td class="px-4 py-3 text-sm text-dark-700">{formatDateTime(session.checkInAt)}</td>
                        <td class="px-4 py-3 text-sm text-dark-700">{formatDateTime(session.checkOutAt)}</td>
                        <td class="px-4 py-3 text-sm text-dark-700">
                          <div class="flex flex-col gap-1">
                            <span
                              class={session.validationStatus === 'flagged' ? 'badge-warning' : 'badge-success'}
                            >
                              {session.validationStatus}
                            </span>
                            {anomalyFlags.length > 0 && (
                              <span class="text-xs text-warning-700">{anomalyFlags.join(', ')}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedUserId.value && (
          <div class="card bg-white shadow-lg rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-dark-800">Employee Timeline: {selectedUserName.value}</h2>
              <button
                onClick$={() => {
                  selectedUserId.value = '';
                  selectedUserName.value = '';
                  timelineSessions.value = [];
                }}
                class="text-danger-600 hover:text-danger-700 font-semibold"
              >
                Close
              </button>
            </div>

            {timelineLoading.value ? (
              <div class="text-dark-500 text-sm">Loading timeline...</div>
            ) : timelineError.value ? (
              <div class="text-danger-700 text-sm">{timelineError.value}</div>
            ) : timelineSessions.value.length === 0 ? (
              <div class="text-dark-500 text-sm">No timeline entries found.</div>
            ) : (
              <div class="space-y-3">
                {timelineSessions.value.map((session) => {
                  const anomalyFlags = parseAnomalyFlags(session.anomalyFlags);
                  return (
                    <div key={session.id} class="rounded-lg border border-light-200 p-4">
                      <div class="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div class="font-semibold text-dark-800">{session.site?.name || session.siteId}</div>
                          <div class="text-xs text-dark-500">
                            Check-in: {formatDateTime(session.checkInAt)} | Check-out: {formatDateTime(session.checkOutAt)}
                          </div>
                        </div>
                        <span class={session.validationStatus === 'flagged' ? 'badge-warning' : 'badge-success'}>
                          {session.validationStatus}
                        </span>
                      </div>

                      {anomalyFlags.length > 0 && (
                        <div class="text-xs text-warning-700 mt-2">Flags: {anomalyFlags.join(', ')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
