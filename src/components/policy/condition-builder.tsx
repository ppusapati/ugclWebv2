/**
 * ABAC Policy Condition Builder
 * 
 * Visual builder for creating complex policy conditions with support for:
 * - Simple conditions (attribute, operator, value)
 * - Logical operators (AND/OR)
 * - Multiple condition groups
 * - Type-aware operators (string, number, boolean, date)
 * - Template variables ({{variable.name}})
 * 
 * @example Simple Condition
 * { "attribute": "user.department", "operator": "=", "value": "engineering" }
 * 
 * @example AND Logic (all must match)
 * {
 *   "AND": [
 *     { "attribute": "user.role", "operator": "=", "value": "manager" },
 *     { "attribute": "resource.amount", "operator": ">", "value": 10000 }
 *   ]
 * }
 * 
 * @example OR Logic (any can match)
 * {
 *   "OR": [
 *     { "attribute": "user.department", "operator": "=", "value": "hr" },
 *     { "attribute": "user.department", "operator": "=", "value": "finance" }
 *   ]
 * }
 */

import { component$, useSignal, useStore, $, QRL } from '@builder.io/qwik';

export interface Condition {
  attribute: string;
  operator: string;
  value: any;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR' | 'NOT';
  conditions?: Condition[];
  groups?: ConditionGroup[];
}

interface ConditionBuilderProps {
  conditions: any;
  onChange$: QRL<(conditions: any) => void>;
}

// Common attributes for ABAC policies
const COMMON_ATTRIBUTES = [
  { value: 'user.id', label: 'User ID', type: 'string' },
  { value: 'user.role', label: 'User Role', type: 'string' },
  { value: 'user.department', label: 'User Department', type: 'string' },
  { value: 'user.clearance_level', label: 'User Clearance Level', type: 'number' },
  { value: 'user.employment_type', label: 'Employment Type', type: 'string' },
  { value: 'user.certification', label: 'User Certification', type: 'string' },
  { value: 'user.assigned_region', label: 'Assigned Region', type: 'string' },
  { value: 'resource.id', label: 'Resource ID', type: 'string' },
  { value: 'resource.type', label: 'Resource Type', type: 'string' },
  { value: 'resource.owner_id', label: 'Resource Owner ID', type: 'string' },
  { value: 'resource.amount', label: 'Resource Amount', type: 'number' },
  { value: 'resource.sensitivity', label: 'Resource Sensitivity', type: 'string' },
  { value: 'resource.status', label: 'Resource Status', type: 'string' },
  { value: 'resource.is_emergency', label: 'Is Emergency', type: 'boolean' },
  { value: 'environment.hour', label: 'Current Hour (0-23)', type: 'number' },
  { value: 'environment.day_of_week', label: 'Day of Week', type: 'string' },
  { value: 'environment.date', label: 'Current Date', type: 'date' },
  { value: 'environment.ip_address', label: 'IP Address', type: 'string' },
];

// Operators based on data type
const OPERATORS = {
  string: [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: 'IN', label: 'In List' },
    { value: 'NOT_IN', label: 'Not In List' },
    { value: 'CONTAINS', label: 'Contains' },
    { value: 'STARTS_WITH', label: 'Starts With' },
    { value: 'ENDS_WITH', label: 'Ends With' },
    { value: 'MATCHES', label: 'Matches Regex' },
  ],
  number: [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: '>=', label: 'Greater Than or Equal' },
    { value: '<=', label: 'Less Than or Equal' },
    { value: 'BETWEEN', label: 'Between' },
    { value: 'IN', label: 'In List' },
  ],
  boolean: [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
  ],
  date: [
    { value: '=', label: 'Equals' },
    { value: '>', label: 'After' },
    { value: '<', label: 'Before' },
    { value: 'BETWEEN', label: 'Between' },
  ],
};

// Condition Templates
const CONDITION_TEMPLATES = [
  {
    name: 'Department Access',
    description: 'User must be in specific department',
    conditions: {
      attribute: 'user.department',
      operator: '=',
      value: 'engineering'
    }
  },
  {
    name: 'Business Hours Only',
    description: 'Only during 9 AM to 5 PM',
    conditions: {
      AND: [
        { attribute: 'environment.hour', operator: '>=', value: 9 },
        { attribute: 'environment.hour', operator: '<', value: 17 }
      ]
    }
  },
  {
    name: 'High-Value Threshold',
    description: 'Amount exceeds 100,000',
    conditions: {
      attribute: 'resource.amount',
      operator: '>',
      value: 100000
    }
  },
  {
    name: 'Manager or Admin',
    description: 'User has manager or admin role',
    conditions: {
      OR: [
        { attribute: 'user.role', operator: '=', value: 'manager' },
        { attribute: 'user.role', operator: '=', value: 'admin' }
      ]
    }
  },
  {
    name: 'Weekday Only',
    description: 'Monday through Friday',
    conditions: {
      attribute: 'environment.day_of_week',
      operator: 'NOT_IN',
      value: ['Saturday', 'Sunday']
    }
  },
  {
    name: 'Resource Owner',
    description: 'User is the resource owner',
    conditions: {
      attribute: 'user.id',
      operator: '=',
      value: '{{resource.owner_id}}'
    }
  },
];

export const ConditionBuilder = component$<ConditionBuilderProps>((props) => {
  const mode = useSignal<'simple' | 'advanced'>('simple');
  const logicOperator = useSignal<'AND' | 'OR'>('AND');
  
  const simpleConditions = useStore<Condition[]>([
    { attribute: '', operator: '=', value: '' }
  ]);

  // Parse existing conditions
  const parseConditions = $(() => {
    if (!props.conditions || Object.keys(props.conditions).length === 0) {
      return;
    }

    // Check if it's AND/OR at root level
    if (props.conditions.AND || props.conditions.OR) {
      mode.value = 'simple';
      logicOperator.value = props.conditions.AND ? 'AND' : 'OR';
      const condArray = props.conditions.AND || props.conditions.OR;
      
      if (Array.isArray(condArray) && condArray.length > 0) {
        simpleConditions.length = 0;
        condArray.forEach((cond: any) => {
          if (cond.attribute) {
            simpleConditions.push({
              attribute: cond.attribute,
              operator: cond.operator,
              value: cond.value
            });
          }
        });
      }
    }
  });

  // Build conditions object from simple conditions
  const buildConditions = $(() => {
    const validConditions = simpleConditions.filter(c => c.attribute && c.operator);
    
    if (validConditions.length === 0) {
      return {};
    }

    if (validConditions.length === 1) {
      return validConditions[0];
    }

    return {
      [logicOperator.value]: validConditions
    };
  });

  // Add new condition
  const addCondition = $(() => {
    simpleConditions.push({ attribute: '', operator: '=', value: '' });
  });

  // Remove condition
  const removeCondition = $((index: number) => {
    simpleConditions.splice(index, 1);
    if (simpleConditions.length === 0) {
      simpleConditions.push({ attribute: '', operator: '=', value: '' });
    }
  });

  // Update condition field
  const updateCondition = $((index: number, field: keyof Condition, value: any) => {
    simpleConditions[index][field] = value;
    
    // Auto-select appropriate operator when attribute changes
    if (field === 'attribute') {
      const attrType = COMMON_ATTRIBUTES.find(a => a.value === value)?.type || 'string';
      const defaultOp = OPERATORS[attrType as keyof typeof OPERATORS]?.[0]?.value || '=';
      simpleConditions[index].operator = defaultOp;
    }
  });

  // Apply changes
  const applyChanges = $(async () => {
    const conditions = await buildConditions();
    await props.onChange$(conditions);
  });

  // Get operators for attribute type
  const getOperatorsForAttribute = (attribute: string) => {
    const attrType = COMMON_ATTRIBUTES.find(a => a.value === attribute)?.type || 'string';
    return OPERATORS[attrType as keyof typeof OPERATORS] || OPERATORS.string;
  };

  return (
    <div class="space-y-4">
      {/* Mode Selector */}
      <div class="flex gap-2 items-center">
        <button
          type="button"
          onClick$={() => mode.value = 'simple'}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode.value === 'simple'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Visual Builder
        </button>
        <button
          type="button"
          onClick$={() => mode.value = 'advanced'}
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${
            mode.value === 'advanced'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          JSON Editor
        </button>
        
        {/* Template Loader */}
        <select
          onChange$={(e) => {
            const template = CONDITION_TEMPLATES.find(t => t.name === (e.target as HTMLSelectElement).value);
            if (template) {
              const conds = template.conditions;
              if ((conds as any).AND || (conds as any).OR) {
                const logic = (conds as any).AND ? 'AND' : 'OR';
                const condArray = (conds as any)[logic];
                logicOperator.value = logic;
                simpleConditions.length = 0;
                condArray.forEach((c: Condition) => simpleConditions.push({...c}));
              } else {
                simpleConditions.length = 0;
                simpleConditions.push({...(conds as Condition)});
              }
              props.onChange$(template.conditions);
              mode.value = 'simple';
            }
            (e.target as HTMLSelectElement).value = '';
          }}
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Load Template...</option>
          {CONDITION_TEMPLATES.map(template => (
            <option key={template.name} value={template.name}>
              {`${template.name} - ${template.description}`}
            </option>
          ))}
        </select>

        <div class="flex-1"></div>
        {mode.value === 'simple' && simpleConditions.length > 1 && (
          <select
            value={logicOperator.value}
            onChange$={(e) => {
              logicOperator.value = (e.target as HTMLSelectElement).value as 'AND' | 'OR';
              applyChanges();
            }}
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
          >
            <option value="AND">All conditions must match (AND)</option>
            <option value="OR">Any condition can match (OR)</option>
          </select>
        )}
      </div>

      {/* Simple Mode - Visual Builder */}
      {mode.value === 'simple' && (
        <div class="space-y-3">
          {simpleConditions.map((condition, index) => {
            const operators = getOperatorsForAttribute(condition.attribute);
            const needsArray = ['IN', 'NOT_IN', 'BETWEEN'].includes(condition.operator);
            
            return (
              <div key={index} class="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex-1 grid grid-cols-3 gap-2">
                  {/* Attribute */}
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Attribute</label>
                    <select
                      value={condition.attribute}
                      onChange$={(e) => updateCondition(index, 'attribute', (e.target as HTMLSelectElement).value)}
                      onBlur$={applyChanges}
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select attribute...</option>
                      {COMMON_ATTRIBUTES.map(attr => (
                        <option key={attr.value} value={attr.value}>{attr.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Operator */}
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                    <select
                      value={condition.operator}
                      onChange$={(e) => updateCondition(index, 'operator', (e.target as HTMLSelectElement).value)}
                      onBlur$={applyChanges}
                      disabled={!condition.attribute}
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      Value {needsArray && <span class="text-gray-500">(comma-separated)</span>}
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value}
                      onInput$={(e) => {
                        const val = (e.target as HTMLInputElement).value;
                        const finalValue = needsArray 
                          ? val.split(',').map(v => v.trim()).filter(Boolean)
                          : val;
                        updateCondition(index, 'value', finalValue);
                      }}
                      onBlur$={applyChanges}
                      placeholder={needsArray ? "value1, value2, value3" : "Enter value..."}
                      class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick$={() => {
                    removeCondition(index);
                    applyChanges();
                  }}
                  class="mt-6 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove condition"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}

          {/* Add Condition Button */}
          <button
            type="button"
            onClick$={async () => {
              addCondition();
              await applyChanges();
            }}
            class="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Condition
          </button>

          {/* Helpful Tips */}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p class="font-semibold mb-1">💡 Tips:</p>
            <ul class="list-disc list-inside space-y-0.5 ml-2">
              <li>Use <strong>user.*</strong> attributes to check user properties</li>
              <li>Use <strong>resource.*</strong> attributes to check resource properties</li>
              <li>Use <strong>environment.*</strong> attributes for time/location conditions</li>
              <li>For template variables, use: <code class="bg-blue-100 px-1 rounded">{`{{variable.name}}`}</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* Advanced Mode - JSON Editor */}
      {mode.value === 'advanced' && (
        <div class="space-y-3">
          <textarea
            value={JSON.stringify(props.conditions, null, 2)}
            onInput$={(e) => {
              try {
                const parsed = JSON.parse((e.target as HTMLTextAreaElement).value);
                props.onChange$(parsed);
              } catch (err) {
                // Invalid JSON - don't update
              }
            }}
            rows={12}
            placeholder='{\n  "AND": [\n    {\n      "attribute": "user.department",\n      "operator": "=",\n      "value": "engineering"\n    }\n  ]\n}'
            class="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500"
          />
          
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <p class="font-semibold mb-1">⚠️ JSON Format:</p>
            <ul class="list-disc list-inside space-y-0.5 ml-2">
              <li>Use <code class="bg-amber-100 px-1 rounded">{`{"AND": [...]}`}</code> for multiple conditions that must all match</li>
              <li>Use <code class="bg-amber-100 px-1 rounded">{`{"OR": [...]}`}</code> for conditions where any can match</li>
              <li>Use <code class="bg-amber-100 px-1 rounded">{`{"NOT": {...}}`}</code> to negate a condition</li>
              <li>Single condition: <code class="bg-amber-100 px-1 rounded">{`{"attribute": "...", "operator": "...", "value": "..."}`}</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* JSON Preview (in simple mode) */}
      {mode.value === 'simple' && simpleConditions.some(c => c.attribute) && (
        <details class="text-sm">
          <summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900 mb-2">
            View Generated JSON
          </summary>
          <pre class="p-3 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(props.conditions, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
});
