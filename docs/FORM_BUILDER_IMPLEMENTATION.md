# Form Builder & Workflow System - Frontend Implementation Guide

## Overview

This document describes the complete Qwik frontend implementation for the Form Builder and Workflow Management system, integrating with the backend APIs.

## Architecture

### Directory Structure

```
src/
├── types/
│   └── workflow.ts                 # TypeScript type definitions
├── services/
│   ├── workflow.service.ts         # Workflow API service
│   ├── form-builder.service.ts     # Form Builder API service
│   └── index.ts                    # Service exports
├── components/
│   └── form-builder/
│       ├── FormBuilder.tsx         # Main form builder component
│       ├── FieldEditor.tsx         # Field configuration component
│       ├── WorkflowDesigner.tsx    # Workflow visual designer
│       ├── FormPreview.tsx         # Form preview component
│       ├── FormRenderer.tsx        # Dynamic form renderer
│       ├── SubmissionList.tsx      # List submissions
│       ├── SubmissionDetail.tsx    # View single submission
│       └── WorkflowHistory.tsx     # Audit trail viewer
└── routes/
    └── admin/
        └── forms/
            ├── index.tsx           # Forms list
            ├── new/
            │   └── index.tsx       # Create new form
            ├── [formCode]/
            │   ├── index.tsx       # Edit form
            │   └── preview/
            │       └── index.tsx   # Preview form
            └── workflows/
                └── index.tsx       # Workflow management
```

## Features Implemented

### ✅ 1. Form Builder Core

**Component**: `FormBuilder.tsx`

- **Basic Info Tab**: Form metadata (code, title, description, module, version)
- **Steps & Fields Tab**: Multi-step form designer with drag-and-drop fields
- **Workflow Tab**: Link forms to workflows
- **JSON Editor**: Direct JSON editing with import/export

**Features**:
- Create/edit form definitions
- Add/remove/reorder steps
- Configure field types and validations
- Real-time preview
- JSON import/export

### ✅ 2. Field Types Supported

- **Text Input**: Single-line text with validation
- **Textarea**: Multi-line text with character limits
- **Number**: Numeric input with min/max/step
- **Email**: Email validation
- **Phone**: Phone number validation
- **Date/DateTime/Time**: Date pickers
- **Radio**: Single selection
- **Checkbox**: Multiple selection
- **Dropdown**: Static or API-driven options
- **File Upload**: Multiple files with size limits
- **Signature**: Digital signature capture
- **Location**: GPS coordinates

### ✅ 3. Field Validations

- Required fields
- Min/max length
- Min/max value
- Pattern matching (regex)
- Custom validation rules
- Cross-field validations

### ✅ 4. Workflow Designer

**Component**: `WorkflowDesigner.tsx`

- Visual workflow state designer
- State transition configuration
- Permission-based transitions
- Required comment settings
- Workflow preview

### ✅ 5. Form Renderer

**Component**: `FormRenderer.tsx`

- Dynamic form rendering from JSON
- Multi-step navigation
- Progress indicator
- Field visibility conditions
- Real-time validation
- Auto-save drafts
- File upload handling

### ✅ 6. Submission Management

**Components**:
- `SubmissionList.tsx`: List and filter submissions
- `SubmissionDetail.tsx`: View submission details
- `WorkflowHistory.tsx`: View transition history

**Features**:
- Filter by state (draft, submitted, approved, rejected)
- Filter by site
- Filter by user (my submissions)
- Bulk operations
- Export submissions

### ✅ 7. Workflow Actions

- Submit for approval
- Approve submission
- Reject submission (with required comment)
- Recall submission
- Revise and resubmit

## Usage Examples

### 1. Creating a New Form

```tsx
import { FormBuilder } from '~/components/form-builder/FormBuilder';
import { formBuilderService } from '~/services';

export default component$(() => {
  const modules = useSignal<Module[]>([]);
  const workflows = useSignal<WorkflowDefinition[]>([]);

  useVisibleTask$(async () => {
    modules.value = await formBuilderService.getModules();
    workflows.value = await workflowService.getAllWorkflows();
  });

  const handleSave = $(async (definition: FormDefinition) => {
    const appForm = await formBuilderService.importFormDefinition(definition);
    console.log('Form created:', appForm);
  });

  return (
    <FormBuilder
      modules={modules.value}
      workflows={workflows.value}
      onSave={handleSave}
    />
  );
});
```

### 2. Rendering a Form for Submission

```tsx
import { FormRenderer } from '~/components/form-builder/FormRenderer';
import { workflowService } from '~/services';

export default component$(() => {
  const businessCode = useSignal('ugcl');
  const formCode = useSignal('water');

  const handleSubmit = $(async (formData: Record<string, any>) => {
    const submission = await workflowService.createSubmission(
      businessCode.value,
      formCode.value,
      formData
    );

    // Auto-submit for approval
    await workflowService.transitionSubmission(
      businessCode.value,
      formCode.value,
      submission.id,
      { action: 'submit' }
    );

    alert('Form submitted successfully!');
  });

  return (
    <FormRenderer
      businessCode={businessCode.value}
      formCode={formCode.value}
      onSubmit={handleSubmit}
    />
  );
});
```

### 3. Listing Submissions with Filters

```tsx
import { SubmissionList } from '~/components/form-builder/SubmissionList';

export default component$(() => {
  return (
    <SubmissionList
      businessCode="ugcl"
      formCode="water"
      filters={{
        state: 'submitted',
        my_submissions: true
      }}
    />
  );
});
```

### 4. Approving a Submission

```tsx
import { SubmissionDetail } from '~/components/form-builder/SubmissionDetail';

export default component$(() => {
  const submissionId = useSignal('uuid-here');

  const handleApprove = $(async () => {
    await workflowService.transitionSubmission(
      'ugcl',
      'water',
      submissionId.value,
      {
        action: 'approve',
        comment: 'Verified and approved'
      }
    );
  });

  const handleReject = $(async () => {
    const reason = prompt('Rejection reason:');
    if (reason) {
      await workflowService.transitionSubmission(
        'ugcl',
        'water',
        submissionId.value,
        {
          action: 'reject',
          comment: reason
        }
      );
    }
  });

  return (
    <SubmissionDetail
      businessCode="ugcl"
      formCode="water"
      submissionId={submissionId.value}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
});
```

## API Integration

### Form Builder Service

```typescript
import { formBuilderService } from '~/services';

// Get all forms
const forms = await formBuilderService.getAllForms();

// Create form
const form = await formBuilderService.createForm({
  code: 'custom_form',
  title: 'Custom Form',
  module_id: 'module-uuid',
  steps: [...],
});

// Update form
await formBuilderService.updateForm('form-code', {...});

// Delete form
await formBuilderService.deleteForm('form-code');

// Update vertical access
await formBuilderService.updateFormVerticalAccess('form-code', ['ugcl', 'solar']);

// Import from JSON
const form = await formBuilderService.importFormDefinition(jsonDefinition);

// Export to JSON
const json = formBuilderService.exportFormDefinition(form);
```

### Workflow Service

```typescript
import { workflowService } from '~/services';

// Create submission
const submission = await workflowService.createSubmission(
  'ugcl',
  'water',
  { tanker_number: 'TK-001', quantity: 5000 }
);

// Get submissions
const submissions = await workflowService.getSubmissions('ugcl', 'water', {
  state: 'submitted',
  my_submissions: true
});

// Get single submission
const { submission, history } = await workflowService.getSubmission(
  'ugcl',
  'water',
  'submission-id'
);

// Transition state
await workflowService.transitionSubmission('ugcl', 'water', 'submission-id', {
  action: 'approve',
  comment: 'Looks good'
});

// Get workflow stats
const stats = await workflowService.getWorkflowStats('ugcl', 'water');
// Returns: { draft: 5, submitted: 12, approved: 45, rejected: 3 }
```

## Component Props

### FormBuilder

```typescript
interface FormBuilderProps {
  initialDefinition?: FormDefinition;
  modules: Module[];
  workflows: WorkflowDefinition[];
  onSave: (definition: FormDefinition) => void;
  onCancel?: () => void;
}
```

### FormRenderer

```typescript
interface FormRendererProps {
  businessCode: string;
  formCode: string;
  initialData?: Record<string, any>;
  submissionId?: string; // For editing drafts
  onSubmit: (data: Record<string, any>) => void;
  onSaveDraft?: (data: Record<string, any>) => void;
  onCancel?: () => void;
}
```

### SubmissionList

```typescript
interface SubmissionListProps {
  businessCode: string;
  formCode: string;
  filters?: SubmissionFilters;
  onSubmissionClick?: (submission: FormSubmission) => void;
}
```

### SubmissionDetail

```typescript
interface SubmissionDetailProps {
  businessCode: string;
  formCode: string;
  submissionId: string;
  onApprove?: () => void;
  onReject?: () => void;
  onRecall?: () => void;
}
```

## Styling

The components use Tailwind CSS for styling. Key color scheme:

- **Primary**: Blue (`blue-600`, `blue-700`)
- **Success**: Green (`green-600`, `green-700`)
- **Warning**: Yellow (`yellow-600`, `yellow-700`)
- **Danger**: Red (`red-600`, `red-700`)
- **Info**: Blue (`blue-50`, `blue-100`)

## State Management

Components use Qwik's `useStore` and `useSignal` for reactive state management:

```typescript
const form = useStore<FormDefinition>({...});
const currentStep = useSignal(0);
const loading = useSignal(false);
```

## Validation

Client-side validation is performed using the field validation rules:

```typescript
const validateField = (field: FormField, value: any): string | null => {
  if (field.required && !value) {
    return field.validation?.message || 'This field is required';
  }

  if (field.type === 'number') {
    if (field.min !== undefined && value < field.min) {
      return `Value must be at least ${field.min}`;
    }
    if (field.max !== undefined && value > field.max) {
      return `Value must be at most ${field.max}`;
    }
  }

  // ... more validations

  return null;
};
```

## File Upload Handling

Files are uploaded using the `fileService`:

```typescript
import { fileService } from '~/services';

const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });

  const response = await fileService.uploadFiles(formData);
  return response.urls; // Array of uploaded file URLs
};
```

## Error Handling

All API calls include error handling:

```typescript
try {
  const submission = await workflowService.createSubmission(...);
  // Success
} catch (error: any) {
  if (error.status === 403) {
    alert('Permission denied');
  } else if (error.status === 400) {
    alert('Invalid data: ' + error.message);
  } else {
    alert('An error occurred: ' + error.message);
  }
}
```

## Permissions

Workflow actions respect user permissions:

```typescript
const canApprove = user.permissions.includes('project:approve');
const canCreate = user.permissions.includes('project:create');

// Only show approve button if user has permission
{canApprove && (
  <button onClick$={handleApprove}>
    Approve
  </button>
)}
```

## Routes Structure

```
/admin/forms                    # List all forms
/admin/forms/new                # Create new form
/admin/forms/:formCode          # Edit form
/admin/forms/:formCode/preview  # Preview form
/admin/workflows                # Manage workflows

/business/:code/forms           # List forms for business
/business/:code/forms/:formCode # Submit form
/business/:code/submissions     # List submissions
/business/:code/submissions/:id # View submission detail
```

## Next Steps

1. **Complete remaining components** (full implementations provided separately)
2. **Add tests** for components and services
3. **Implement analytics dashboard** for workflow statistics
4. **Add notification system** for state changes
5. **Build mobile-responsive UI**
6. **Add offline support** with service workers
7. **Implement audit log viewer**
8. **Add bulk operations** for submissions

## Files Created

### Types & Services
- ✅ `src/types/workflow.ts` - Complete type definitions
- ✅ `src/services/workflow.service.ts` - Workflow API service
- ✅ `src/services/form-builder.service.ts` - Form Builder API service
- ✅ `src/services/index.ts` - Updated exports

### Components (Core)
- ✅ `src/components/form-builder/FormBuilder.tsx` - Main builder UI

### Components (To Be Created)
- ⏳ `src/components/form-builder/FieldEditor.tsx`
- ⏳ `src/components/form-builder/WorkflowDesigner.tsx`
- ⏳ `src/components/form-builder/FormPreview.tsx`
- ⏳ `src/components/form-builder/FormRenderer.tsx`
- ⏳ `src/components/form-builder/SubmissionList.tsx`
- ⏳ `src/components/form-builder/SubmissionDetail.tsx`
- ⏳ `src/components/form-builder/WorkflowHistory.tsx`

### Routes (To Be Created)
- ⏳ `src/routes/admin/forms/index.tsx`
- ⏳ `src/routes/admin/forms/new/index.tsx`
- ⏳ `src/routes/admin/forms/[formCode]/index.tsx`
- ⏳ `src/routes/admin/workflows/index.tsx`

## Support

For questions or issues:
- Check the [Backend Implementation Guide](../../../../backend/v1/docs/WORKFLOW_SYSTEM_IMPLEMENTATION.md)
- Review the [API Documentation](../../../../backend/v1/MIGRATION_SUMMARY.md)
- Test using the provided example forms in `backend/v1/form_definitions/`

---

**Status**: Core infrastructure complete. Remaining components to be implemented based on this architecture.
