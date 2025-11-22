# Workflow Designer Guide

## Overview

The Workflow Designer is a comprehensive visual tool for creating and managing workflow state machines in your application. It provides an intuitive interface for defining workflow states, transitions, and actions with built-in validation.

## Features

### 1. **Complete Field Editor** (`FieldEditorComplete.tsx`)
A full-featured field configuration editor supporting all field types:

- **Basic Fields**: Text, Textarea, Number, Email, Phone
- **Date/Time Fields**: Date, DateTime, Time
- **Selection Fields**: Radio, Checkbox, Dropdown, Select
- **Special Fields**: File Upload, Signature, Location

#### Key Features:
- Real-time field preview
- Type-specific configuration options
- Validation rules (min/max length, pattern matching, date ranges)
- API-driven dropdown support
- Options management for selection fields
- Default value configuration

### 2. **Visual Workflow Diagram** (`WorkflowDiagram.tsx`)
An interactive visual representation of your workflow:

- State nodes with color coding
- Transition arrows between states
- Initial state indicator (blue border)
- Final state indicator (rounded, green checkmark)
- Clickable states and transitions for quick editing
- Summary statistics
- Validation warnings for common issues

### 3. **Comprehensive Validation** (`validation.ts`)
Built-in validation ensures your workflows are correctly configured:

#### Validates:
- Required fields (code, name, version)
- Unique state codes
- Valid state and transition references
- Proper code formatting (lowercase, underscores only)
- Unreachable states detection
- Missing final states warning
- Duplicate transitions detection
- Transitions from final states

### 4. **State Editor** (`StateEditor.tsx`)
Configure individual workflow states with:
- State code and display name
- Description
- Color badge (7 color options)
- Icon selection
- Final state designation
- Live preview

### 5. **Transition Editor** (`TransitionEditor.tsx`)
Define state transitions with:
- Source and target states
- Action name
- Button label
- Permission requirements
- Comment requirement toggle
- Live preview

## Usage

### Creating a New Workflow

1. **Navigate to Workflow Management**
   ```
   /admin/workflows
   ```

2. **Click "Create New Workflow"**

3. **Configure Basic Information**
   - **Workflow Code**: Unique identifier (lowercase, underscores only)
     - Example: `standard_approval`, `project_lifecycle`
   - **Name**: Display name
     - Example: "Standard Approval Workflow"
   - **Description**: Brief description of the workflow
   - **Version**: Semantic versioning (e.g., "1.0.0")
   - **Initial State**: The starting state for new submissions
   - **Active**: Toggle workflow activation

4. **Define States**
   - Click "Add" to create a new state
   - Configure each state:
     ```typescript
     {
       code: 'draft',              // Unique identifier
       name: 'Draft',              // Display name
       description: 'Initial...',  // Optional description
       color: 'gray',              // Badge color
       icon: 'edit',               // Icon identifier
       is_final: false             // Terminal state?
     }
     ```
   - Common state patterns:
     - **Draft**: Initial state for new items (gray)
     - **Submitted**: Awaiting review (blue)
     - **Approved**: Completed successfully (green)
     - **Rejected**: Declined (red)
     - **Cancelled**: User cancelled (gray)

5. **Define Transitions**
   - Click "Add" to create a new transition
   - Configure each transition:
     ```typescript
     {
       from: 'draft',                    // Source state code
       to: 'submitted',                  // Target state code
       action: 'submit',                 // Action identifier
       label: 'Submit for Approval',    // Button text
       permission: 'project:create',     // Optional permission
       requires_comment: false           // Require comment?
     }
     ```

6. **View Diagram**
   - Switch to "Diagram" tab to visualize your workflow
   - Click on states/transitions to navigate to their editors
   - Review statistics and validation warnings

7. **Validate**
   - Click "Validate" button to check for errors
   - Fix any errors shown in the validation summary
   - Warnings are informational but don't block saving

8. **Save**
   - Click "Save Workflow" to persist changes
   - Save button is disabled if validation errors exist

## Workflow Design Best Practices

### 1. State Design

**Keep it Simple**
- Start with minimal states (3-5)
- Add complexity only when needed
- Avoid deeply nested state hierarchies

**Clear Naming**
- Use descriptive, action-oriented names
- Consistent naming across workflows
- Example: "Pending Review" not "State 2"

**Color Coding**
```typescript
// Suggested color scheme:
gray   -> Draft/Initial states
blue   -> In-progress/Submitted
yellow -> Pending/Waiting
green  -> Approved/Completed
red    -> Rejected/Failed
purple -> Special/Archived
orange -> Escalated/Urgent
```

### 2. Transition Design

**Clear Actions**
- Use verb-based action names: `submit`, `approve`, `reject`
- One action per transition
- Consistent action naming across workflows

**Permissions**
- Apply principle of least privilege
- Use granular permissions: `project:approve` not `admin_all`
- Consider role-based restrictions

**Comments**
- Require comments for rejection/escalation transitions
- Optional for routine approvals
- Required for state reversals

### 3. Validation Tips

**Avoid Unreachable States**
```typescript
// Bad: State "archived" can never be reached
states: [
  { code: 'draft', ... },
  { code: 'approved', ... },
  { code: 'archived', ... }  // No transitions TO this state
]

// Good: All states are reachable
transitions: [
  { from: 'draft', to: 'approved', ... },
  { from: 'approved', to: 'archived', ... }
]
```

**Define Final States**
```typescript
// Mark terminal states as final
{ code: 'approved', is_final: true },
{ code: 'rejected', is_final: true },
{ code: 'cancelled', is_final: true }
```

**Prevent Cycles (if desired)**
```typescript
// Allow resubmission after rejection
{ from: 'rejected', to: 'draft', action: 'revise' }

// Or make rejection final
{ code: 'rejected', is_final: true }
```

## Example Workflows

### Simple Approval Workflow

```typescript
{
  code: 'simple_approval',
  name: 'Simple Approval',
  initial_state: 'draft',
  states: [
    { code: 'draft', name: 'Draft', color: 'gray', is_final: false },
    { code: 'pending', name: 'Pending Review', color: 'blue', is_final: false },
    { code: 'approved', name: 'Approved', color: 'green', is_final: true },
    { code: 'rejected', name: 'Rejected', color: 'red', is_final: true }
  ],
  transitions: [
    { from: 'draft', to: 'pending', action: 'submit', label: 'Submit' },
    { from: 'pending', to: 'approved', action: 'approve', label: 'Approve', permission: 'project:approve' },
    { from: 'pending', to: 'rejected', action: 'reject', label: 'Reject', permission: 'project:approve', requires_comment: true },
    { from: 'rejected', to: 'draft', action: 'revise', label: 'Revise & Resubmit' }
  ]
}
```

### Multi-Level Approval Workflow

```typescript
{
  code: 'multi_level_approval',
  name: 'Multi-Level Approval',
  initial_state: 'draft',
  states: [
    { code: 'draft', name: 'Draft', color: 'gray' },
    { code: 'manager_review', name: 'Manager Review', color: 'blue' },
    { code: 'director_review', name: 'Director Review', color: 'blue' },
    { code: 'approved', name: 'Approved', color: 'green', is_final: true },
    { code: 'rejected', name: 'Rejected', color: 'red', is_final: true }
  ],
  transitions: [
    { from: 'draft', to: 'manager_review', action: 'submit' },
    { from: 'manager_review', to: 'director_review', action: 'approve_l1', permission: 'project:approve_manager' },
    { from: 'manager_review', to: 'rejected', action: 'reject', permission: 'project:approve_manager', requires_comment: true },
    { from: 'director_review', to: 'approved', action: 'approve_l2', permission: 'project:approve_director' },
    { from: 'director_review', to: 'rejected', action: 'reject', permission: 'project:approve_director', requires_comment: true }
  ]
}
```

## API Integration

### Saving Workflows

The workflow designer automatically calls your `onSave` callback:

```typescript
const handleSave = $(async (workflow: Partial<WorkflowDefinition>) => {
  try {
    if (isEditing) {
      await workflowService.updateWorkflow(workflowId, workflow);
    } else {
      await workflowService.createWorkflow(workflow);
    }
    // Success handling
  } catch (error) {
    // Error handling
  }
});
```

### Loading Workflows

Pass existing workflows via the `workflow` prop:

```typescript
<WorkflowDesigner
  workflow={selectedWorkflow}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

## Component Architecture

```
WorkflowDesigner (Main Container)
├── ValidationSummary (Errors/Warnings)
├── Basic Info Tab
│   └── Form inputs for metadata
├── States Tab
│   ├── States List (Sidebar)
│   └── StateEditor (Editor Panel)
├── Transitions Tab
│   ├── Transitions List (Sidebar)
│   └── TransitionEditor (Editor Panel)
├── Diagram Tab
│   └── WorkflowDiagram (Visual Representation)
└── Preview Tab
    └── JSON Export
```

## Keyboard Shortcuts

- **Tab Navigation**: Use Tab/Shift+Tab to move between tabs
- **Escape**: Close validation summary (if visible)
- **Enter**: Save workflow (when validation passes)

## Troubleshooting

### Common Validation Errors

**"Workflow code must contain only lowercase letters, numbers, and underscores"**
- Fix: Use format like `my_workflow_123`
- Invalid: `My Workflow`, `my-workflow`

**"Duplicate state code"**
- Fix: Ensure each state has a unique `code` value
- State names can be the same, but codes must differ

**"Source state does not exist"**
- Fix: Ensure transition `from` field references an existing state code
- Check for typos in state codes

**"State is unreachable from the initial state"**
- Warning: Add a transition leading to this state
- Or remove the state if it's not needed

**"Non-final state has no outgoing transitions"**
- Warning: Add transitions or mark state as final
- Dead-end states may trap workflows

### Performance Tips

- Keep workflows under 20 states for optimal performance
- Use meaningful state codes (easier debugging)
- Validate frequently during design
- Use the diagram view to spot issues visually

## Advanced Features

### Conditional Transitions

While not built into the UI, your backend can implement conditional transitions based on:
- User attributes
- Business rules
- Time-based conditions
- External system states

### Workflow Versioning

Maintain multiple versions of workflows:
- Use semantic versioning (1.0.0, 1.1.0, 2.0.0)
- Archive old versions when creating new ones
- Allow migration between workflow versions

### Audit Trail

Track all workflow transitions:
- Actor (who performed the action)
- Timestamp
- Comments
- Metadata (IP address, device, etc.)

## Support

For issues or feature requests, please contact the development team or file an issue in the project repository.
