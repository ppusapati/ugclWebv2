// src/routes/admin/policies/[id]/test/index.tsx
import { component$, useStore, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation, useNavigate } from '@builder.io/qwik-city';
import { apiClient } from '~/services';

interface Policy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  status: string;
}

interface TestRequest {
  subject: {
    id?: string;
    type?: string;
    attributes?: Record<string, any>;
  };
  action: string;
  resource: string;
  context?: Record<string, any>;
}

interface TestResult {
  result: 'ALLOW' | 'DENY';
  matched_policies: Array<{
    id: string;
    name: string;
    effect: 'ALLOW' | 'DENY';
    priority: number;
  }>;
  evaluation_time_ms: number;
  timestamp: string;
  details?: {
    conditions_evaluated?: number;
    conditions_passed?: number;
    reason?: string;
  };
}

export default component$(() => {
  const location = useLocation();
  const nav = useNavigate();
  const policyId = location.params.id;

  const policy = useSignal<Policy | null>(null);
  const loading = useSignal(true);
  const testing = useSignal(false);
  const testResult = useSignal<TestResult | null>(null);
  const error = useSignal('');

  const testRequest = useStore<TestRequest>({
    subject: {
      id: '',
      type: 'user',
      attributes: {},
    },
    action: '',
    resource: '',
    context: {},
  });

  // For editing JSON fields
  const subjectAttributesJson = useSignal('{}');
  const contextJson = useSignal('{}');

  // Load policy
  const loadPolicy = $(async () => {
    try {
      loading.value = true;
      const data = await apiClient.get<Policy>(`/policies/${policyId}`);
      policy.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to load policy';
    } finally {
      loading.value = false;
    }
  });

  // Run test
  const runTest = $(async () => {
    try {
      testing.value = true;
      error.value = '';
      testResult.value = null;

      // Parse JSON fields
      try {
        testRequest.subject.attributes = JSON.parse(subjectAttributesJson.value || '{}');
      } catch {
        error.value = 'Invalid JSON in Subject Attributes';
        return;
      }

      try {
        testRequest.context = JSON.parse(contextJson.value || '{}');
      } catch {
        error.value = 'Invalid JSON in Context';
        return;
      }

      // Validate required fields
      if (!testRequest.action.trim()) {
        error.value = 'Action is required';
        return;
      }

      if (!testRequest.resource.trim()) {
        error.value = 'Resource is required';
        return;
      }

      // Make the test request
      const result = await apiClient.post<TestResult>(`/policies/${policyId}/test`, testRequest);
      testResult.value = result;
    } catch (err: any) {
      error.value = err.message || 'Failed to run test';
    } finally {
      testing.value = false;
    }
  });

  // Load quick test templates
  const loadTemplate = $((templateName: string) => {
    switch (templateName) {
      case 'basic_user':
        testRequest.subject = {
          id: 'user-123',
          type: 'user',
          attributes: {},
        };
        testRequest.action = 'read';
        testRequest.resource = 'project:456';
        testRequest.context = {};
        subjectAttributesJson.value = '{}';
        contextJson.value = '{}';
        break;

      case 'with_department':
        testRequest.subject = {
          id: 'user-123',
          type: 'user',
          attributes: {
            department: 'engineering',
            role: 'developer',
          },
        };
        testRequest.action = 'write';
        testRequest.resource = 'project:456';
        testRequest.context = {};
        subjectAttributesJson.value = JSON.stringify({
          department: 'engineering',
          role: 'developer',
        }, null, 2);
        contextJson.value = '{}';
        break;

      case 'time_based':
        testRequest.subject = {
          id: 'user-123',
          type: 'user',
          attributes: {},
        };
        testRequest.action = 'approve';
        testRequest.resource = 'expense:789';
        testRequest.context = {
          time: {
            hour: new Date().getHours(),
            day: new Date().getDay(),
          },
          ip_address: '192.168.1.1',
        };
        subjectAttributesJson.value = '{}';
        contextJson.value = JSON.stringify({
          time: {
            hour: new Date().getHours(),
            day: new Date().getDay(),
          },
          ip_address: '192.168.1.1',
        }, null, 2);
        break;

      default:
        break;
    }
  });

  // Load policy on mount
  useVisibleTask$(async () => {
    await loadPolicy();
  });

  if (loading.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (error.value && !policy.value) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div class="text-6xl text-red-500 mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p class="text-gray-600 mb-6">{error.value}</p>
          <button
            onClick$={() => nav('/admin/policies')}
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Policies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            onClick$={() => nav(`/admin/policies/${policyId}`)}
            class="text-gray-600 hover:text-gray-900"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Test Policy</h1>
            <p class="text-gray-600 mt-1">{policy.value?.display_name}</p>
          </div>
        </div>

        {/* Quick Templates */}
        <div class="flex gap-2">
          <select
            onChange$={(e) => {
              const value = (e.target as HTMLSelectElement).value;
              if (value) loadTemplate(value);
            }}
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Load Template...</option>
            <option value="basic_user">Basic User Test</option>
            <option value="with_department">User with Department</option>
            <option value="time_based">Time-Based Context</option>
          </select>
        </div>
      </div>

      {/* Policy Info */}
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="text-blue-600 text-2xl">ℹ️</div>
          <div class="flex-1">
            <h3 class="font-semibold text-blue-900">About This Policy</h3>
            <p class="text-sm text-blue-800 mt-1">{policy.value?.description}</p>
            <div class="flex gap-4 mt-2 text-sm">
              <span class={`px-2 py-1 rounded-full font-semibold ${
                policy.value?.effect === 'ALLOW' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {policy.value?.effect}
              </span>
              <span class="text-blue-700">Status: <strong>{policy.value?.status}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error.value && (
        <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.value}
        </div>
      )}

      <div class="grid grid-cols-2 gap-6">
        {/* Left Column - Test Inputs */}
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 class="text-xl font-semibold text-gray-900">Test Configuration</h2>

            {/* Subject */}
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-gray-700 uppercase">Subject</h3>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Subject ID</label>
                <input
                  type="text"
                  value={testRequest.subject.id}
                  onInput$={(e) => testRequest.subject.id = (e.target as HTMLInputElement).value}
                  placeholder="e.g., user-123"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Subject Type</label>
                <select
                  value={testRequest.subject.type}
                  onChange$={(e) => testRequest.subject.type = (e.target as HTMLSelectElement).value}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="user">User</option>
                  <option value="service">Service</option>
                  <option value="group">Group</option>
                  <option value="role">Role</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Subject Attributes (JSON)</label>
                <textarea
                  value={subjectAttributesJson.value}
                  onInput$={(e) => subjectAttributesJson.value = (e.target as HTMLTextAreaElement).value}
                  rows={4}
                  placeholder='{"department": "engineering", "role": "developer"}'
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">Optional: Add custom attributes as JSON</p>
              </div>
            </div>

            {/* Action & Resource */}
            <div class="space-y-3 pt-4 border-t border-gray-200">
              <h3 class="text-sm font-semibold text-gray-700 uppercase">Action & Resource</h3>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <input
                  type="text"
                  value={testRequest.action}
                  onInput$={(e) => testRequest.action = (e.target as HTMLInputElement).value}
                  placeholder="e.g., read, write, delete, approve"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Resource *</label>
                <input
                  type="text"
                  value={testRequest.resource}
                  onInput$={(e) => testRequest.resource = (e.target as HTMLInputElement).value}
                  placeholder="e.g., project:123, report:*, expense:456"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Context */}
            <div class="space-y-3 pt-4 border-t border-gray-200">
              <h3 class="text-sm font-semibold text-gray-700 uppercase">Context (Optional)</h3>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Context (JSON)</label>
                <textarea
                  value={contextJson.value}
                  onInput$={(e) => contextJson.value = (e.target as HTMLTextAreaElement).value}
                  rows={5}
                  placeholder='{"time": {"hour": 14}, "ip_address": "192.168.1.1"}'
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">Optional: Add environmental context as JSON</p>
              </div>
            </div>

            {/* Run Test Button */}
            <button
              onClick$={runTest}
              disabled={testing.value}
              class="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing.value ? 'Running Test...' : 'Run Test'}
            </button>
          </div>
        </div>

        {/* Right Column - Test Results */}
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Result</h2>

            {!testResult.value ? (
              <div class="text-center py-12 text-gray-500">
                <div class="text-6xl mb-4">🧪</div>
                <p>No test results yet</p>
                <p class="text-sm mt-2">Fill in the test configuration and click "Run Test"</p>
              </div>
            ) : (
              <div class="space-y-4">
                {/* Result Status */}
                <div class={`p-6 rounded-lg text-center ${
                  testResult.value.result === 'ALLOW'
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-red-50 border-2 border-red-500'
                }`}>
                  <div class="text-6xl mb-2">
                    {testResult.value.result === 'ALLOW' ? '✅' : '❌'}
                  </div>
                  <div class={`text-3xl font-bold ${
                    testResult.value.result === 'ALLOW' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.value.result}
                  </div>
                  <p class={`text-sm mt-2 ${
                    testResult.value.result === 'ALLOW' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Access {testResult.value.result === 'ALLOW' ? 'Granted' : 'Denied'}
                  </p>
                </div>

                {/* Performance */}
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-700">Evaluation Time</span>
                    <span class="text-lg font-bold text-primary-600">
                      {testResult.value.evaluation_time_ms}ms
                    </span>
                  </div>
                  <div class="flex justify-between items-center mt-2">
                    <span class="text-sm font-medium text-gray-700">Timestamp</span>
                    <span class="text-sm text-gray-600">
                      {new Date(testResult.value.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Matched Policies */}
                {testResult.value.matched_policies && testResult.value.matched_policies.length > 0 && (
                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-gray-700 uppercase">Matched Policies</h3>
                    {testResult.value.matched_policies.map((matchedPolicy) => (
                      <div
                        key={matchedPolicy.id}
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <div class="text-sm font-medium text-gray-900">{matchedPolicy.name}</div>
                          <div class="text-xs text-gray-600">Priority: {matchedPolicy.priority}</div>
                        </div>
                        <span class={`px-2 py-1 text-xs font-semibold rounded-full ${
                          matchedPolicy.effect === 'ALLOW'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {matchedPolicy.effect}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Details */}
                {testResult.value.details && (
                  <div class="space-y-2">
                    <h3 class="text-sm font-semibold text-gray-700 uppercase">Evaluation Details</h3>
                    <div class="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      {testResult.value.details.conditions_evaluated !== undefined && (
                        <div class="flex justify-between">
                          <span class="text-gray-700">Conditions Evaluated:</span>
                          <span class="font-medium">{testResult.value.details.conditions_evaluated}</span>
                        </div>
                      )}
                      {testResult.value.details.conditions_passed !== undefined && (
                        <div class="flex justify-between">
                          <span class="text-gray-700">Conditions Passed:</span>
                          <span class="font-medium">{testResult.value.details.conditions_passed}</span>
                        </div>
                      )}
                      {testResult.value.details.reason && (
                        <div class="pt-2 border-t border-gray-200">
                          <span class="text-gray-700">Reason:</span>
                          <p class="mt-1 text-gray-900">{testResult.value.details.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Response */}
                <details class="text-sm">
                  <summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                    View Full Response
                  </summary>
                  <pre class="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(testResult.value, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
