/**
 * Task Card Component
 * Displays a task summary card
 */

import { component$, type QRL } from '@builder.io/qwik';
import type { Task } from '../../types/project';

export interface TaskCardProps {
  task: Task;
  showProject?: boolean;
  onView$?: QRL<(task: Task) => void>;
  onAssign$?: QRL<(task: Task) => void>;
  onUpdateStatus$?: QRL<(task: Task) => void>;
}

export const TaskCard = component$<TaskCardProps>(({
  task,
  showProject = false,
  onView$,
  onAssign$,
  onUpdateStatus$,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const budgetUtilization = task.allocated_budget > 0
    ? (task.total_cost / task.allocated_budget) * 100
    : 0;

  return (
    <div class="card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
      {/* Header */}
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-sm font-semibold text-gray-900">{task.title}</h3>
            <i class={`i-heroicons-flag-solid w-4 h-4 inline-block ${getPriorityColor(task.priority)}`}></i>
          </div>
          <p class="text-xs text-gray-500">Code: {task.code}</p>
          {showProject && task.project && (
            <p class="text-xs text-blue-600 mt-1">
              <i class="i-heroicons-folder-solid w-4 h-4 inline-block mr-1"></i>
              {task.project.name}
            </p>
          )}
        </div>
        <span class={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Node Info */}
      <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div class="flex items-center gap-1 text-green-700 bg-green-50 rounded px-2 py-1">
          <i class="i-heroicons-map-pin-solid w-4 h-4 inline-block"></i>
          <span class="truncate">{task.start_node?.name || 'Start Node'}</span>
        </div>
        <div class="flex items-center gap-1 text-red-700 bg-red-50 rounded px-2 py-1">
          <i class="i-heroicons-map-pin w-4 h-4 inline-block"></i>
          <span class="truncate">{task.stop_node?.name || 'Stop Node'}</span>
        </div>
      </div>

      {/* Progress */}
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-gray-600">Progress</span>
          <span class="font-medium text-gray-900">{task.progress}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class={`h-2 rounded-full transition-all ${
              task.progress === 100 ? 'bg-green-600' :
              task.progress >= 50 ? 'bg-blue-600' :
              'bg-orange-500'
            }`}
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Assignments */}
      {task.assignments && task.assignments.length > 0 && (
        <div class="mb-3">
          <div class="text-xs text-gray-500 mb-1">Assigned to:</div>
          <div class="flex flex-wrap gap-1">
            {task.assignments.slice(0, 3).map(assignment => (
              <div key={assignment.id} class="badge-primary-600 text-xs px-2 py-0.5">
                {assignment.user_name || assignment.user_id}
                <span class="ml-1 text-xs opacity-70">({assignment.role})</span>
              </div>
            ))}
            {task.assignments.length > 3 && (
              <div class="badge-gray-600 text-xs px-2 py-0.5">
                +{task.assignments.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Budget Info */}
      {task.allocated_budget > 0 && (
        <div class="bg-gray-50 rounded p-2 mb-3">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-gray-600">Budget</span>
            <span class="font-medium text-gray-900">
              ₹{(task.allocated_budget / 1000).toFixed(1)}K
            </span>
          </div>
          {budgetUtilization > 0 && (
            <div class="text-xs">
              <div class="w-full bg-gray-200 rounded-full h-1">
                <div
                  class={`h-1 rounded-full ${
                    budgetUtilization > 100 ? 'bg-red-500' :
                    budgetUtilization > 80 ? 'bg-orange-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                ></div>
              </div>
              <span class="text-gray-500 mt-0.5 inline-block">
                {budgetUtilization.toFixed(1)}% used
              </span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {task.planned_start_date && (
        <div class="text-xs text-gray-500 mb-3 flex items-center gap-3">
          <span>
            <i class="i-heroicons-calendar w-4 h-4 inline-block text-gray-400 mr-1"></i>
            {new Date(task.planned_start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
          {task.planned_end_date && (
            <span>
              <i class="i-heroicons-calendar-days w-4 h-4 inline-block text-gray-400 mr-1"></i>
              {new Date(task.planned_end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div class="flex gap-2 pt-3 border-t border-gray-200">
        {onView$ && (
          <button
            onClick$={() => onView$(task)}
            class="flex-1 btn btn-primary text-xs py-1.5"
          >
            <i class="i-heroicons-eye-solid w-4 h-4 inline-block text-white mr-1"></i>
            View
          </button>
        )}
        {onAssign$ && task.status === 'pending' && (
          <button
            onClick$={() => onAssign$(task)}
            class="flex-1 btn btn-success text-xs py-1.5"
          >
            <i class="i-heroicons-user-plus-solid w-4 h-4 inline-block text-white mr-1"></i>
            Assign
          </button>
        )}
        {onUpdateStatus$ && task.status !== 'completed' && (
          <button
            onClick$={() => onUpdateStatus$(task)}
            class="flex-1 btn btn-secondary text-xs py-1.5"
          >
            <i class="i-heroicons-arrow-path-solid w-4 h-4 inline-block text-white mr-1"></i>
            Update
          </button>
        )}
      </div>
    </div>
  );
});
