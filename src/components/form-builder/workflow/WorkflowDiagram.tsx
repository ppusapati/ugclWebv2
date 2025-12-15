// src/components/form-builder/workflow/WorkflowDiagram.tsx
import { component$, type PropFunction } from '@builder.io/qwik';
import type { WorkflowState, WorkflowTransitionDef } from '~/types/workflow';

interface WorkflowDiagramProps {
  states: WorkflowState[];
  transitions: WorkflowTransitionDef[];
  initialState: string;
  onStateClick$?: PropFunction<(state: WorkflowState) => void>;
  onTransitionClick$?: PropFunction<(transition: WorkflowTransitionDef) => void>;
}

const STATE_COLORS = {
  gray: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  green: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
  red: { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
};

export default component$<WorkflowDiagramProps>((props) => {
  // Group states by their connections for better layout
  const getStateConnections = (stateCode: string) => {
    const incoming = props.transitions.filter(t => t.to === stateCode);
    const outgoing = props.transitions.filter(t => t.from === stateCode);
    return { incoming, outgoing };
  };

  const getColorClasses = (color?: string) => {
    return STATE_COLORS[color as keyof typeof STATE_COLORS] || STATE_COLORS.gray;
  };

  return (
    <div class="workflow-diagram bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Workflow Diagram</h3>
        <p class="text-sm text-gray-600 mt-1">
          Visual representation of states and transitions
        </p>
      </div>

      {/* Legend */}
      <div class="mb-6 flex items-center gap-4 p-3 bg-gray-50 rounded-lg text-xs">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded"></div>
          <span class="text-gray-600">Initial State</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 bg-green-200 border-2 border-green-500 rounded-full"></div>
          <span class="text-gray-600">Final State</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span class="text-gray-600">Transition</span>
        </div>
      </div>

      {/* Diagram */}
      <div class="space-y-6">
        {props.states.length === 0 ? (
          <div class="text-center py-12 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No states defined yet</p>
            <p class="text-sm mt-1">Add states to visualize your workflow</p>
          </div>
        ) : (
          <div class="space-y-8">
            {props.states.map((state, idx) => {
              const { incoming, outgoing } = getStateConnections(state.code);
              const colors = getColorClasses(state.color);
              const isInitial = state.code === props.initialState;

              return (
                <div key={state.code} class="relative">
                  {/* State Node */}
                  <div class="flex items-start gap-4">
                    {/* Connection Line (if not first) */}
                    {idx > 0 && incoming.length > 0 && (
                      <div class="absolute -top-8 left-24 w-0.5 h-8 bg-gray-300"></div>
                    )}

                    {/* State Box */}
                    <div
                      onClick$={() => props.onStateClick$?.(state)}
                      class={`
                        relative flex-shrink-0 w-48 px-4 py-3
                        ${colors.bg} ${colors.text}
                        border-2 ${isInitial ? 'border-blue-500 shadow-md' : colors.border}
                        ${state.is_final ? 'rounded-full' : 'rounded-lg'}
                        cursor-pointer hover:shadow-lg transition-all
                      `}
                    >
                      {/* Initial State Indicator */}
                      {isInitial && (
                        <div class="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span class="text-white text-xs font-bold">▶</span>
                        </div>
                      )}

                      {/* Final State Indicator */}
                      {state.is_final && (
                        <div class="absolute -top-2 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span class="text-white text-xs font-bold">✓</span>
                        </div>
                      )}

                      <div class="font-semibold text-sm">{state.name}</div>
                      <code class="text-xs opacity-70">{state.code}</code>

                      {state.description && (
                        <p class="text-xs mt-1 opacity-80">{state.description}</p>
                      )}

                      {/* Connection counts */}
                      <div class="flex gap-2 mt-2 text-xs opacity-70">
                        <span title="Incoming transitions">← {incoming.length}</span>
                        <span title="Outgoing transitions">→ {outgoing.length}</span>
                      </div>
                    </div>

                    {/* Outgoing Transitions */}
                    <div class="flex-1 space-y-2">
                      {outgoing.length > 0 ? (
                        outgoing.map((transition, tIdx) => {
                          const toState = props.states.find(s => s.code === transition.to);
                          const toColors = getColorClasses(toState?.color);

                          return (
                            <div
                              key={tIdx}
                              onClick$={() => props.onTransitionClick$?.(transition)}
                              class="flex items-center gap-2 group cursor-pointer"
                            >
                              {/* Arrow */}
                              <svg class="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>

                              {/* Transition Info */}
                              <div class="flex-1 p-2 bg-gray-50 rounded border border-gray-200 group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                                <div class="flex items-center justify-between">
                                  <div>
                                    <span class="text-sm font-medium text-gray-900">
                                      {transition.label || transition.action}
                                    </span>
                                    {transition.permission && (
                                      <span class="ml-2 text-xs text-gray-500">🔒 {transition.permission}</span>
                                    )}
                                    {transition.requires_comment && (
                                      <span class="ml-2 text-xs text-gray-500">💬</span>
                                    )}
                                  </div>

                                  {/* Target State Badge */}
                                  <div class={`px-2 py-1 ${toColors.bg} ${toColors.text} rounded text-xs font-medium`}>
                                    {toState?.name || transition.to}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : state.is_final ? (
                        <div class="text-sm text-gray-500 italic">
                          Terminal state (no outgoing transitions)
                        </div>
                      ) : (
                        <div class="text-sm text-gray-400">
                          No transitions defined
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="grid grid-cols-4 gap-4 text-center">
          <div class="p-3 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-700">{props.states.length}</div>
            <div class="text-xs text-blue-600">States</div>
          </div>
          <div class="p-3 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-700">{props.transitions.length}</div>
            <div class="text-xs text-green-600">Transitions</div>
          </div>
          <div class="p-3 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-700">
              {props.states.filter(s => s.is_final).length}
            </div>
            <div class="text-xs text-purple-600">Final States</div>
          </div>
          <div class="p-3 bg-orange-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-700">
              {props.states.filter(s => s.code === props.initialState).length}
            </div>
            <div class="text-xs text-orange-600">Initial State</div>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {props.states.length > 0 && (
        <div class="mt-4">
          {props.states.filter(s => s.code === props.initialState).length === 0 && (
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Warning: Initial state "{props.initialState}" is not defined in states list
            </div>
          )}

          {props.states.filter(s => !s.is_final).some(s => getStateConnections(s.code).outgoing.length === 0) && (
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mt-2">
              ⚠️ Warning: Some non-final states have no outgoing transitions
            </div>
          )}
        </div>
      )}
    </div>
  );
});
