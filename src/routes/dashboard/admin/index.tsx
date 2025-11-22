// src/routes/admin/index.tsx
import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';

export default component$(() => {
  const nav = useNavigate();

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Dashboard
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Business Verticals Card */}
          <div
            onClick$={() => nav('/admin/businesses')}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-4">
              <span class="i-heroicons-building-office w-12 h-12 text-blue-600" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                Business Verticals
              </h2>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              Manage business verticals, settings, and configurations
            </p>
          </div>

          {/* Roles & Permissions Card */}
          <div
            onClick$={() => nav('/admin/roles')}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-4">
              <span class="i-heroicons-shield-check w-12 h-12 text-green-600" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                Roles & Permissions
              </h2>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              Configure system roles and permission sets
            </p>
          </div>

          {/* Authorization Dashboard Card */}
          <div
            onClick$={() => nav('/admin/authorization')}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-4">
              <span class="i-heroicons-lock-closed w-12 h-12 text-purple-600" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                Authorization
              </h2>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              View and manage user authorization matrix
            </p>
          </div>

          {/* User Management Card */}
          <div
            onClick$={() => nav('/dashboard/users')}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-4">
              <span class="i-heroicons-user-group w-12 h-12 text-orange-600" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                User Management
              </h2>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              Manage system users and their access
            </p>
          </div>

          {/* Report Builder Card */}
          <div
            onClick$={() => nav('/dashboard/report_builder')}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-4">
              <span class="i-heroicons-chart-bar w-12 h-12 text-indigo-600" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                Report Builder
              </h2>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              Create and customize report templates
            </p>
          </div>

          {/* Form Builder Card */}
          <div
            onClick$={() => nav('/dashboard/form_builder')}
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div class="flex items-center mb-4">
              <span class="i-heroicons-document-text w-12 h-12 text-pink-600" />
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                Form Builder
              </h2>
            </div>
            <p class="text-gray-600 dark:text-gray-300">
              Design dynamic forms and data collection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
