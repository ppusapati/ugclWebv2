/**
 * Project Card Component
 * Displays a project summary card
 */

import { component$, type QRL } from '@builder.io/qwik';
import type { Project } from '../../types/project';

export interface ProjectCardProps {
  project: Project;
  onView$?: QRL<(project: Project) => void>;
  onEdit$?: QRL<(project: Project) => void>;
}

export const ProjectCard = component$<ProjectCardProps>(({ project, onView$, onEdit$ }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const budgetUtilization = project.total_budget > 0
    ? (project.spent_budget / project.total_budget) * 100
    : 0;

  return (
    <div class="card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
      {/* Header */}
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <h3 class="text-base font-semibold text-gray-900 mb-1">{project.name}</h3>
          <p class="text-xs text-gray-500">Code: {project.code}</p>
        </div>
        <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Stats Grid */}
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="bg-gray-50 rounded p-2">
          <div class="text-xs text-gray-500 mb-1">Progress</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
            <span class="text-xs font-medium text-gray-700">{project.progress}%</span>
          </div>
        </div>

        <div class="bg-gray-50 rounded p-2">
          <div class="text-xs text-gray-500 mb-1">Budget</div>
          <div class="text-sm font-semibold text-gray-900">
            ₹{(project.total_budget / 100000).toFixed(2)}L
          </div>
          <div class="text-xs text-gray-500">
            {budgetUtilization.toFixed(1)}% used
          </div>
        </div>
      </div>

      {/* Timeline */}
      {project.start_date && (
        <div class="text-xs text-gray-500 mb-3">
          <span class="inline-block mr-3">
            <i class="i-heroicons-calendar w-4 h-4 inline-block text-gray-400 mr-1"></i>
            {new Date(project.start_date).toLocaleDateString('en-IN')}
          </span>
          {project.end_date && (
            <span class="inline-block">
              <i class="i-heroicons-calendar-days w-4 h-4 inline-block text-gray-400 mr-1"></i>
              {new Date(project.end_date).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
      )}

      {/* KMZ Status */}
      {project.kmz_file_name && (
        <div class="text-xs text-green-600 mb-3 flex items-center gap-1">
          <i class="i-heroicons-map-pin-solid w-4 h-4 inline-block"></i>
          <span>KMZ Uploaded</span>
        </div>
      )}

      {/* Actions */}
      <div class="flex gap-2 pt-3 border-t border-gray-200">
        {onView$ && (
          <button
            onClick$={() => onView$(project)}
            class="flex-1 btn btn-primary text-xs py-1.5"
          >
            <i class="i-heroicons-eye-solid w-4 h-4 inline-block text-white mr-1"></i>
            View
          </button>
        )}
        {onEdit$ && (
          <button
            onClick$={() => onEdit$(project)}
            class="flex-1 btn btn-secondary text-xs py-1.5"
          >
            <i class="i-heroicons-pencil-square-solid w-4 h-4 inline-block text-white mr-1"></i>
            Edit
          </button>
        )}
      </div>
    </div>
  );
});
