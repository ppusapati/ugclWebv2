/**
 * Project Stats Card Component
 * Displays project statistics and KPIs
 */

import { component$ } from '@builder.io/qwik';
import { StatCard } from '~/components/ds';
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
          <StatCard key={i}>
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div class="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </StatCard>
        ))}
      </div>
    );
  }

  const totalBudget = Number((stats as any)?.total_budget || 0);
  const spentBudget = Number((stats as any)?.spent_budget || 0);
  const totalZones = Number((stats as any)?.total_zones ?? (stats as any)?.zones_count ?? 0);
  const totalNodes = Number((stats as any)?.total_nodes ??
    ((stats as any)?.nodes_by_type || []).reduce((sum: number, row: any) => sum + Number(row?.count || 0), 0));
  const totalTasks = Number((stats as any)?.total_tasks ??
    ((stats as any)?.tasks_by_status || []).reduce((sum: number, row: any) => sum + Number(row?.count || 0), 0));
  const completedTasks = Number((stats as any)?.tasks_by_status?.find((row: any) => row?.status === 'completed')?.count || 0);
  const budgetUtilization = totalBudget > 0
    ? (spentBudget / totalBudget) * 100
    : 0;

  return (
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Zones */}
      <StatCard tone="info" class="bg-gradient-to-br from-blue-50 to-white">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-blue-600 font-medium mb-1">Total Zones</div>
            <div class="text-2xl font-bold text-blue-900">{totalZones}</div>
          </div>
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-map-solid h-5 w-5 inline-block text-blue-600"></i>
          </div>
        </div>
      </StatCard>

      {/* Total Nodes */}
      <StatCard tone="success" class="bg-gradient-to-br from-green-50 to-white">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-green-600 font-medium mb-1">Total Nodes</div>
            <div class="text-2xl font-bold text-green-900">{totalNodes}</div>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-map-pin-solid h-5 w-5 inline-block text-green-600"></i>
          </div>
        </div>
      </StatCard>

      {/* Total Tasks */}
      <StatCard tone="accent" class="bg-gradient-to-br from-purple-50 to-white">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-purple-600 font-medium mb-1">Total Tasks</div>
            <div class="text-2xl font-bold text-purple-900">{totalTasks}</div>
          </div>
          <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-clipboard-document-list-solid h-5 w-5 inline-block text-purple-600"></i>
          </div>
        </div>
        <div class="mt-3 text-xs text-gray-600">
          {completedTasks} completed
        </div>
      </StatCard>

      {/* Budget */}
      <StatCard tone="warning" class="bg-gradient-to-br from-orange-50 to-white">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs text-orange-600 font-medium mb-1">Budget</div>
            <div class="text-lg font-bold text-orange-900">
              ₹{((totalBudget) / 100000).toFixed(1)}L
            </div>
          </div>
          <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <i class="i-heroicons-currency-rupee-solid h-5 w-5 inline-block text-orange-600"></i>
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
              } w-[var(--budget-width)]`}
              style={{ '--budget-width': `${Math.min(budgetUtilization, 100)}%` }}
            ></div>
          </div>
        </div>
      </StatCard>
    </div>
  );
});
