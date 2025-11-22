// src/components/auth/authorization-dashboard.tsx
import { component$, useStore, $ } from '@builder.io/qwik';
import { RoleManagement } from './role-management';
import { PermissionManagement } from './permission-management';
import { UserRoleAssignment } from './user-role-assignment';
import { BusinessAccessControl } from './business-access-control';

export const AuthorizationDashboard = component$(() => {
  const state = useStore({
    activeTab: 'overview',
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Roles', icon: '👥' },
    { id: 'roles', label: 'Role Management', icon: '🔐' },
    { id: 'permissions', label: 'Permissions', icon: '🛡️' },
    { id: 'business', label: 'Business Access', icon: '🏢' },
  ];

  const renderTabContent = $(() => {
    switch (state.activeTab) {
      case 'users':
        return <UserRoleAssignment />;
      case 'roles':
        return <RoleManagement />;
      case 'permissions':
        return <PermissionManagement />;
      case 'business':
        return <BusinessAccessControl />;
      default:
        return (
          <div class="authorization-overview p-6">
            <div class="mb-8">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Authorization System Overview</h2>
              <p class="text-gray-600">
                Manage roles, permissions, and business access for your organization
              </p>
            </div>

            {/* Quick Stats */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div class="bg-white border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div class="text-3xl mb-2">👥</div>
                <div class="text-2xl font-bold text-blue-600">--</div>
                <div class="text-sm text-gray-600">Total Users</div>
              </div>
              <div class="bg-white border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div class="text-3xl mb-2">🔐</div>
                <div class="text-2xl font-bold text-green-600">--</div>
                <div class="text-sm text-gray-600">Active Roles</div>
              </div>
              <div class="bg-white border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div class="text-3xl mb-2">🛡️</div>
                <div class="text-2xl font-bold text-purple-600">--</div>
                <div class="text-sm text-gray-600">Permissions</div>
              </div>
              <div class="bg-white border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                <div class="text-3xl mb-2">🏢</div>
                <div class="text-2xl font-bold text-orange-600">--</div>
                <div class="text-sm text-gray-600">Business Units</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div class="bg-white border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-3 flex items-center">
                  <span class="mr-2">👥</span>
                  User Management
                </h3>
                <p class="text-gray-600 mb-4 text-sm">
                  Assign roles and manage user permissions across different business verticals
                </p>
                <button
                  class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick$={() => { state.activeTab = 'users'; }}
                >
                  Manage User Roles
                </button>
              </div>

              <div class="bg-white border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-3 flex items-center">
                  <span class="mr-2">🔐</span>
                  Role Configuration
                </h3>
                <p class="text-gray-600 mb-4 text-sm">
                  Create and configure roles with specific permissions for different business needs
                </p>
                <button
                  class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick$={() => { state.activeTab = 'roles'; }}
                >
                  Configure Roles
                </button>
              </div>

              <div class="bg-white border rounded-lg p-6">
                <h3 class="text-lg font-semibold mb-3 flex items-center">
                  <span class="mr-2">🛡️</span>
                  Permission Control
                </h3>
                <p class="text-gray-600 mb-4 text-sm">
                  Define and manage granular permissions for different system features
                </p>
                <button
                  class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  onClick$={() => { state.activeTab = 'permissions'; }}
                >
                  Manage Permissions
                </button>
              </div>
            </div>

            {/* System Architecture */}
            <div class="bg-white border rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Authorization Architecture</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                  <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span class="text-2xl">👤</span>
                  </div>
                  <h4 class="font-medium mb-2">Users</h4>
                  <p class="text-sm text-gray-600">
                    Individual users with unique identities and authentication credentials
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span class="text-2xl">🔐</span>
                  </div>
                  <h4 class="font-medium mb-2">Roles</h4>
                  <p class="text-sm text-gray-600">
                    Collections of permissions that define what users can do within business contexts
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span class="text-2xl">🏢</span>
                  </div>
                  <h4 class="font-medium mb-2">Business Verticals</h4>
                  <p class="text-sm text-gray-600">
                    Separate business units with their own access controls and role assignments
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  });

  return (
    <div class="authorization-dashboard min-h-screen bg-gray-50">
      {/* Header */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">Authorization Management</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-500">Admin Panel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav class="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                class={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  state.activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick$={() => { state.activeTab = tab.id; }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div class="max-w-7xl mx-auto">
        {renderTabContent()}
      </div>
    </div>
  );
});