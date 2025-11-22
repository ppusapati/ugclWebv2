/**
 * Project Stats Card Component
 * Displays project statistics and KPIs
 */

import { component$ } from '@builder.io/qwik';
import type { ProjectStats } from '../../types/project';

export interface ProjectStatsCardProps {
  stats: ProjectStats;
  loading?: boolean;
}

export const ProjectStatsCard = component$<ProjectStatsCardProps>(({ stats, loading }) => {
  if (loading) {
    return (
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} class="card bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div class="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalBudget = Number((stats as any)?.total_budget || 0);
  const spentBudget = Number((stats as any)?.spent_budget || 0);
  const budgetUtilization = totalBudget > 0
    ? (spentBudget / totalBudget) * 100
    : 0;

  return (
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Zones */}
      <div class="card bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-sm border border-blue-200 p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-blue-600 font-medium mb-1">Total Zones</div>
            <div class="text-2xl font-bold text-blue-900">{(stats as any)?.total_zones ?? 0}</div>
          </div>
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="i-mdi-map text-xl text-blue-600"></i>
          </div>
        </div>
      </div>

      {/* Total Nodes */}
      <div class="card bg-gradient-to-br from-green-50 to-white rounded-lg shadow-sm border border-green-200 p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-green-600 font-medium mb-1">Total Nodes</div>
            <div class="text-2xl font-bold text-green-900">{(stats as any)?.total_nodes ?? 0}</div>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <i class="i-mdi-map-marker text-xl text-green-600"></i>
          </div>
        </div>
      </div>

      {/* Total Tasks */}
      <div class="card bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-sm border border-purple-200 p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-purple-600 font-medium mb-1">Total Tasks</div>
            <div class="text-2xl font-bold text-purple-900">{(stats as any)?.total_tasks ?? 0}</div>
          </div>
          <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="i-mdi-clipboard-list text-xl text-purple-600"></i>
          </div>
        </div>
        <div class="mt-3 text-xs text-gray-600">
          {(stats as any)?.tasks_by_status?.completed || 0} completed
        </div>
      </div>

      {/* Budget */}
      <div class="card bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-sm border border-orange-200 p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-orange-600 font-medium mb-1">Budget</div>
            <div class="text-lg font-bold text-orange-900">
              ₹{((totalBudget) / 100000).toFixed(1)}L
            </div>
          </div>
          <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <i class="i-mdi-currency-inr text-xl text-orange-600"></i>
          </div>
        </div>
        <div class="mt-2">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-gray-600">Utilized</span>
            <span class="font-medium text-gray-900">{budgetUtilization.toFixed(1)}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5">
            <div
              class={`h-1.5 rounded-full ${
                budgetUtilization > 90 ? 'bg-red-500' :
                budgetUtilization > 70 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
});
