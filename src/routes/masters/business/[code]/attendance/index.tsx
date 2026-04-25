import { $, component$, isServer, useSignal, useTask$ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { attendanceService } from '~/services';
import type {
  AttendanceHeadcountSite,
  AttendanceSession,
} from '~/services';
import { Alert, Badge, Btn, PageHeader, SectionCard } from '~/components/ds';

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

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const businessCode = loc.params.code;

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
    try {
      error.value = '';
      const [activeRes, logRes, headcountRes] = await Promise.all([
        attendanceService.getActiveSessions(businessCode, { page: 1, limit: 100 }),
        attendanceService.getLogs(businessCode, { page: 1, limit: 100 }),
        attendanceService.getHeadcount(businessCode),
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
    selectedUserId.value = userId;
    selectedUserName.value = userName;
    timelineError.value = '';
    timelineLoading.value = true;

    try {
      const response = await attendanceService.getEmployeeTimeline(businessCode, userId, {
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
    await loadDashboard();
  });

  const flaggedActiveCount = activeSessions.value.filter(
    (session) => session.validationStatus === 'flagged'
  ).length;

  if (loading.value) {
    return (
      <div class="flex items-center justify-center py-16">
        <div class="text-center">
          <div class="animate-spin text-4xl text-primary-500 mb-4">⏳</div>
          <p class="text-neutral-600">Loading attendance monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6 py-2">
        <PageHeader
          title="Attendance Monitoring"
          subtitle={`Live tracking and attendance audit for ${businessCode}`}
        >
          <Btn q:slot="actions" variant="secondary" onClick$={() => nav(`/masters/business/${businessCode}/sites`)}>
            Sites
          </Btn>
          <Btn q:slot="actions" onClick$={refreshDashboard} disabled={refreshing.value}>
            {refreshing.value ? 'Refreshing...' : 'Refresh'}
          </Btn>
        </PageHeader>

        {error.value && (
          <Alert variant="error" class="border-l-4">
            <p class="text-error-800">{error.value}</p>
          </Alert>
        )}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SectionCard class="p-5">
            <div class="text-sm text-neutral-600">Active Workers</div>
            <div class="text-3xl font-bold text-primary-600 mt-2">{totalActive.value}</div>
          </SectionCard>
          <SectionCard class="p-5">
            <div class="text-sm text-neutral-600">Flagged Active</div>
            <div class="text-3xl font-bold text-warning-600 mt-2">{flaggedActiveCount}</div>
          </SectionCard>
          <SectionCard class="p-5">
            <div class="text-sm text-neutral-600">Sites With Presence</div>
            <div class="text-3xl font-bold text-info-600 mt-2">{headcountBySite.value.length}</div>
          </SectionCard>
          <SectionCard class="p-5">
            <div class="text-sm text-neutral-600">Recent Sessions</div>
            <div class="text-3xl font-bold text-success-600 mt-2">{attendanceLogs.value.length}</div>
          </SectionCard>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionCard class="lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-neutral-800">Live Sessions</h2>
              <span class="text-xs text-neutral-500">{activeSessions.value.length} active</span>
            </div>

            {activeSessions.value.length === 0 ? (
              <div class="text-center py-10 text-neutral-500">No active attendance sessions right now.</div>
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-light-200">
                  <thead class="bg-neutral-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Worker</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Site</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Status</th>
                      <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Last Seen</th>
                      <th class="px-4 py-3 text-right text-xs font-semibold text-neutral-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-light-200">
                    {activeSessions.value.map((session) => {
                      const anomalyFlags = parseAnomalyFlags(session.anomalyFlags);
                      const workerName = session.user?.name || session.userId;

                      return (
                        <tr key={session.id} class="hover:bg-neutral-50 transition">
                          <td class="px-4 py-3">
                            <div class="text-sm font-semibold text-neutral-800">{workerName}</div>
                            <div class="text-xs text-neutral-500">{session.user?.phone || '-'}</div>
                          </td>
                          <td class="px-4 py-3 text-sm text-neutral-700">{session.site?.name || session.siteId}</td>
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-2 flex-wrap">
                              {session.validationStatus === 'flagged' ? (
                                <Badge variant="warning">Flagged</Badge>
                              ) : (
                                <Badge variant="success">Accepted</Badge>
                              )}
                              {anomalyFlags.length > 0 && (
                                <span class="text-xs text-warning-700">{anomalyFlags.join(', ')}</span>
                              )}
                            </div>
                          </td>
                          <td class="px-4 py-3 text-sm text-neutral-700">
                            <div>{formatDateTime(session.lastSeenAt)}</div>
                            <div class="text-xs text-neutral-500">{minutesSince(session.lastSeenAt)} ago</div>
                          </td>
                          <td class="px-4 py-3 text-right">
                            <Btn
                              variant="ghost"
                              size="sm"
                              onClick$={() => loadTimeline(session.userId, workerName)}
                            >
                              Timeline
                            </Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <h2 class="text-xl font-bold text-neutral-800 mb-4">Headcount by Site</h2>

            {headcountBySite.value.length === 0 ? (
              <div class="text-neutral-500 text-sm">No active headcount data.</div>
            ) : (
              <div class="space-y-3">
                {headcountBySite.value.map((item) => (
                  <div key={item.siteId} class="rounded-lg border border-neutral-200 p-4">
                    <div class="flex justify-between items-start gap-2">
                      <div>
                        <div class="font-semibold text-neutral-800">{item.siteName}</div>
                        <div class="text-xs text-neutral-500">Last seen: {formatDateTime(item.lastSeenAt)}</div>
                      </div>
                      <Badge variant="info">{item.activeCount}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard>
          <h2 class="text-xl font-bold text-neutral-800 mb-4">Recent Attendance Logs</h2>

          {attendanceLogs.value.length === 0 ? (
            <div class="text-neutral-500 text-sm">No attendance logs found.</div>
          ) : (
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-light-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Worker</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Site</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Check-In</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Check-Out</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Validation</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-light-200">
                  {attendanceLogs.value.map((session) => {
                    const anomalyFlags = parseAnomalyFlags(session.anomalyFlags);

                    return (
                      <tr key={session.id} class="hover:bg-neutral-50 transition">
                        <td class="px-4 py-3 text-sm text-neutral-800">{session.user?.name || session.userId}</td>
                        <td class="px-4 py-3 text-sm text-neutral-700">{session.site?.name || session.siteId}</td>
                        <td class="px-4 py-3 text-sm text-neutral-700">{formatDateTime(session.checkInAt)}</td>
                        <td class="px-4 py-3 text-sm text-neutral-700">{formatDateTime(session.checkOutAt)}</td>
                        <td class="px-4 py-3 text-sm text-neutral-700">
                          <div class="flex flex-col gap-1">
                            <span
                              class=""
                            >
                              <Badge variant={session.validationStatus === 'flagged' ? 'warning' : 'success'}>
                                {session.validationStatus}
                              </Badge>
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
        </SectionCard>

        {selectedUserId.value && (
          <SectionCard>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-neutral-800">Employee Timeline: {selectedUserName.value}</h2>
              <Btn
                onClick$={() => {
                  selectedUserId.value = '';
                  selectedUserName.value = '';
                  timelineSessions.value = [];
                  timelineError.value = '';
                }}
                variant="ghost"
              >
                Close
              </Btn>
            </div>

            {timelineLoading.value && (
              <div class="text-sm text-neutral-600">Loading employee timeline...</div>
            )}

            {timelineError.value && (
              <Alert variant="error" class="border-l-4">
                <p class="text-error-800">{timelineError.value}</p>
              </Alert>
            )}

            {!timelineLoading.value && !timelineError.value && timelineSessions.value.length === 0 && (
              <div class="text-sm text-neutral-600">No timeline sessions found for this employee.</div>
            )}

            {!timelineLoading.value && !timelineError.value && timelineSessions.value.length > 0 && (
              <div class="space-y-4">
                {timelineSessions.value.map((session) => (
                  <div key={session.id} class="rounded-lg border border-neutral-200 p-4 space-y-2">
                    <div class="flex flex-wrap gap-2 items-center">
                      <Badge variant="neutral">{session.status}</Badge>
                      <span class="text-xs text-neutral-500">Site: {session.site?.name || session.siteId}</span>
                      <Badge variant={session.validationStatus === 'flagged' ? 'warning' : 'success'}>
                        {session.validationStatus}
                      </Badge>
                    </div>
                    <div class="text-sm text-neutral-700">
                      Check-in: {formatDateTime(session.checkInAt)}
                    </div>
                    <div class="text-sm text-neutral-700">
                      Check-out: {formatDateTime(session.checkOutAt)}
                    </div>
                    <div class="text-sm text-neutral-700">
                      Last seen: {formatDateTime(session.lastSeenAt)}
                    </div>
                    {session.events && session.events.length > 0 && (
                      <div class="pt-2 border-t border-neutral-200">
                        <div class="text-xs font-semibold text-neutral-600 uppercase mb-2">Events</div>
                        <div class="space-y-2">
                          {session.events.map((event) => (
                            <div key={event.id} class="text-xs text-neutral-700 rounded bg-neutral-100 px-3 py-2">
                              <span class="font-semibold">{event.eventType}</span>
                              {' at '}
                              {formatDateTime(event.eventTime)}
                              {' ('}
                              {event.validationStatus}
                              {')'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}
    </div>
  );
});
