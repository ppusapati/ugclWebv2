// src/components/form-builder/workflow/validation.ts
import type { WorkflowDefinition, WorkflowState, WorkflowTransitionDef } from '~/types/workflow';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateWorkflow(workflow: Partial<WorkflowDefinition>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Basic Information Validation
  if (!workflow.code || workflow.code.trim() === '') {
    errors.push({
      field: 'code',
      message: 'Workflow code is required',
      severity: 'error',
    });
  } else if (!/^[a-z0-9_]+$/.test(workflow.code)) {
    errors.push({
      field: 'code',
      message: 'Workflow code must contain only lowercase letters, numbers, and underscores',
      severity: 'error',
    });
  }

  if (!workflow.name || workflow.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Workflow name is required',
      severity: 'error',
    });
  }

  if (!workflow.version || workflow.version.trim() === '') {
    errors.push({
      field: 'version',
      message: 'Version is required',
      severity: 'error',
    });
  }

  // States Validation
  if (!workflow.states || workflow.states.length === 0) {
    errors.push({
      field: 'states',
      message: 'At least one state is required',
      severity: 'error',
    });
  } else {
    // Check for duplicate state codes
    const stateCodes = new Set<string>();
    workflow.states.forEach((state, index) => {
      if (!state.code || state.code.trim() === '') {
        errors.push({
          field: `states[${index}].code`,
          message: `State ${index + 1}: Code is required`,
          severity: 'error',
        });
      } else if (!/^[a-z0-9_]+$/.test(state.code)) {
        errors.push({
          field: `states[${index}].code`,
          message: `State ${index + 1}: Code must contain only lowercase letters, numbers, and underscores`,
          severity: 'error',
        });
      } else if (stateCodes.has(state.code)) {
        errors.push({
          field: `states[${index}].code`,
          message: `State ${index + 1}: Duplicate state code "${state.code}"`,
          severity: 'error',
        });
      } else {
        stateCodes.add(state.code);
      }

      if (!state.name || state.name.trim() === '') {
        errors.push({
          field: `states[${index}].name`,
          message: `State ${index + 1}: Name is required`,
          severity: 'error',
        });
      }
    });

    // Check if initial state exists
    if (!workflow.initial_state || workflow.initial_state.trim() === '') {
      errors.push({
        field: 'initial_state',
        message: 'Initial state is required',
        severity: 'error',
      });
    } else if (!stateCodes.has(workflow.initial_state)) {
      errors.push({
        field: 'initial_state',
        message: `Initial state "${workflow.initial_state}" does not exist in states list`,
        severity: 'error',
      });
    }

    // Check for unreachable states (except initial state)
    const reachableStates = new Set([workflow.initial_state]);
    let changed = true;
    while (changed) {
      changed = false;
      workflow.transitions?.forEach(t => {
        if (reachableStates.has(t.from) && !reachableStates.has(t.to)) {
          reachableStates.add(t.to);
          changed = true;
        }
      });
    }

    workflow.states.forEach((state, index) => {
      if (!reachableStates.has(state.code) && state.code !== workflow.initial_state) {
        warnings.push({
          field: `states[${index}]`,
          message: `State "${state.name}" (${state.code}) is unreachable from the initial state`,
          severity: 'warning',
        });
      }

      // Check for states with no outgoing transitions (non-final states)
      if (!state.is_final) {
        const hasOutgoing = workflow.transitions?.some(t => t.from === state.code);
        if (!hasOutgoing) {
          warnings.push({
            field: `states[${index}]`,
            message: `Non-final state "${state.name}" has no outgoing transitions`,
            severity: 'warning',
          });
        }
      }
    });
  }

  // Transitions Validation
  if (workflow.transitions && workflow.transitions.length > 0) {
    const stateCodes = new Set(workflow.states?.map(s => s.code) || []);

    workflow.transitions.forEach((transition, index) => {
      if (!transition.from || transition.from.trim() === '') {
        errors.push({
          field: `transitions[${index}].from`,
          message: `Transition ${index + 1}: Source state is required`,
          severity: 'error',
        });
      } else if (!stateCodes.has(transition.from)) {
        errors.push({
          field: `transitions[${index}].from`,
          message: `Transition ${index + 1}: Source state "${transition.from}" does not exist`,
          severity: 'error',
        });
      }

      if (!transition.to || transition.to.trim() === '') {
        errors.push({
          field: `transitions[${index}].to`,
          message: `Transition ${index + 1}: Target state is required`,
          severity: 'error',
        });
      } else if (!stateCodes.has(transition.to)) {
        errors.push({
          field: `transitions[${index}].to`,
          message: `Transition ${index + 1}: Target state "${transition.to}" does not exist`,
          severity: 'error',
        });
      }

      if (!transition.action || transition.action.trim() === '') {
        errors.push({
          field: `transitions[${index}].action`,
          message: `Transition ${index + 1}: Action is required`,
          severity: 'error',
        });
      } else if (!/^[a-z0-9_]+$/.test(transition.action)) {
        errors.push({
          field: `transitions[${index}].action`,
          message: `Transition ${index + 1}: Action must contain only lowercase letters, numbers, and underscores`,
          severity: 'error',
        });
      }

      // Check for transitions from final states
      const fromState = workflow.states?.find(s => s.code === transition.from);
      if (fromState?.is_final) {
        warnings.push({
          field: `transitions[${index}]`,
          message: `Transition from final state "${fromState.name}" (${fromState.code})`,
          severity: 'warning',
        });
      }

      // Check for duplicate transitions
      const duplicates = workflow.transitions?.filter(
        (t, i) => i !== index && t.from === transition.from && t.to === transition.to && t.action === transition.action
      );
      if (duplicates && duplicates.length > 0) {
        errors.push({
          field: `transitions[${index}]`,
          message: `Transition ${index + 1}: Duplicate transition (${transition.from} --${transition.action}--> ${transition.to})`,
          severity: 'error',
        });
      }
    });
  } else {
    warnings.push({
      field: 'transitions',
      message: 'No transitions defined - workflow will be static',
      severity: 'warning',
    });
  }

  // Check for cycles that don't lead to final states
  const finalStates = new Set(workflow.states?.filter(s => s.is_final).map(s => s.code) || []);
  if (finalStates.size === 0) {
    warnings.push({
      field: 'states',
      message: 'No final states defined - workflow may not have clear completion criteria',
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateState(state: WorkflowState): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!state.code || state.code.trim() === '') {
    errors.push({
      field: 'code',
      message: 'State code is required',
      severity: 'error',
    });
  } else if (!/^[a-z0-9_]+$/.test(state.code)) {
    errors.push({
      field: 'code',
      message: 'State code must contain only lowercase letters, numbers, and underscores',
      severity: 'error',
    });
  }

  if (!state.name || state.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'State name is required',
      severity: 'error',
    });
  }

  return errors;
}

export function validateTransition(
  transition: WorkflowTransitionDef,
  states: WorkflowState[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const stateCodes = new Set(states.map(s => s.code));

  if (!transition.from || transition.from.trim() === '') {
    errors.push({
      field: 'from',
      message: 'Source state is required',
      severity: 'error',
    });
  } else if (!stateCodes.has(transition.from)) {
    errors.push({
      field: 'from',
      message: `Source state "${transition.from}" does not exist`,
      severity: 'error',
    });
  }

  if (!transition.to || transition.to.trim() === '') {
    errors.push({
      field: 'to',
      message: 'Target state is required',
      severity: 'error',
    });
  } else if (!stateCodes.has(transition.to)) {
    errors.push({
      field: 'to',
      message: `Target state "${transition.to}" does not exist`,
      severity: 'error',
    });
  }

  if (!transition.action || transition.action.trim() === '') {
    errors.push({
      field: 'action',
      message: 'Action is required',
      severity: 'error',
    });
  } else if (!/^[a-z0-9_]+$/.test(transition.action)) {
    errors.push({
      field: 'action',
      message: 'Action must contain only lowercase letters, numbers, and underscores',
      severity: 'error',
    });
  }

  return errors;
}
