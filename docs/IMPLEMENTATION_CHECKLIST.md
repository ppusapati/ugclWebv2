# Form Builder & Workflow System - Detailed Implementation Checklist

## ✅ Phase 1: Core Infrastructure (COMPLETE)

### Types & Services
- [x] `src/types/workflow.ts` - All TypeScript type definitions
- [x] `src/services/workflow.service.ts` - Workflow & submission API service
- [x] `src/services/form-builder.service.ts` - Form builder API service
- [x] `src/services/index.ts` - Export all services

### Base Components
- [x] `src/components/form-builder/FormBuilder.tsx` - Main form builder UI
- [x] `src/components/form-builder/FieldEditor.tsx` - Field configuration editor

**Status**: ✅ 100% Complete - Ready to use!

---

## 🔨 Phase 2: Workflow Designer Components

### File: `src/components/form-builder/workflow/WorkflowDesigner.tsx`
**Purpose**: Main workflow designer container
**Features**:
- State list sidebar
- Transition editor
- Visual diagram (optional)
- Save/Export workflow

### File: `src/components/form-builder/workflow/StateEditor.tsx`
**Purpose**: Edit individual workflow states
**Features**:
- State code & name
- Color picker for UI
- Icon selector
- Mark as final state

### File: `src/components/form-builder/workflow/TransitionEditor.tsx`
**Purpose**: Edit state transitions
**Features**:
- From/To state selectors
- Action name input
- Permission selector
- Requires comment checkbox

### File: `src/components/form-builder/workflow/WorkflowDiagram.tsx`
**Purpose**: Visual representation of workflow (optional - use a library like React Flow)
**Features**:
- Nodes for states
- Edges for transitions
- Drag-and-drop states
- Click to edit

**Estimated Time**: 6-8 hours
**Dependencies**: None
**Priority**: HIGH

---

## 🎨 Phase 3: Form Rendering Components

### File: `src/components/form-builder/renderer/FormRenderer.tsx`
**Purpose**: Main container for rendering forms dynamically
**Features**:
- Load form definition from API
- Multi-step navigation
- Progress indicator
- Draft auto-save
- Submit handling

### File: `src/components/form-builder/renderer/StepNavigation.tsx`
**Purpose**: Navigation controls for multi-step forms
**Features**:
- Previous/Next buttons
- Step indicator dots
- Progress percentage
- Validation before next step

### File: `src/components/form-builder/renderer/FieldRenderer.tsx`
**Purpose**: Render individual fields based on type
**Features**:
- Switch on field type
- Render appropriate input
- Handle validation
- Show error messages

### File: `src/components/form-builder/renderer/fields/TextField.tsx`
**Purpose**: Text input field
**Features**:
- Single-line text input
- Validation (required, pattern, length)
- Error display
- Hint text

### File: `src/components/form-builder/renderer/fields/TextAreaField.tsx`
**Purpose**: Multi-line text input
**Features**:
- Textarea with rows config
- Character counter
- Max length validation

### File: `src/components/form-builder/renderer/fields/NumberField.tsx`
**Purpose**: Number input field
**Features**:
- Number input with min/max/step
- Prefix/suffix display
- Validation

### File: `src/components/form-builder/renderer/fields/DateField.tsx`
**Purpose**: Date picker field
**Features**:
- Date picker UI
- Min/max date validation
- Format handling

### File: `src/components/form-builder/renderer/fields/SelectField.tsx`
**Purpose**: Dropdown/Radio/Checkbox fields
**Features**:
- Static options
- API-driven options
- Multi-select support

### File: `src/components/form-builder/renderer/fields/FileUploadField.tsx`
**Purpose**: File upload field
**Features**:
- Multiple file support
- File type validation
- Size validation
- Preview uploaded files
- Progress indicator

**Estimated Time**: 10-12 hours
**Dependencies**: Phase 2 (for workflow integration)
**Priority**: HIGH

---

## 📋 Phase 4: Submission Management Components

### File: `src/components/form-builder/submissions/SubmissionList.tsx`
**Purpose**: List all form submissions
**Features**:
- Data table with pagination
- Filter by state (dropdown)
- Filter by date range
- Search by user/site
- State badges (colored)
- Click to view detail

### File: `src/components/form-builder/submissions/SubmissionFilters.tsx`
**Purpose**: Filter controls for submission list
**Features**:
- State filter dropdown
- Date range picker
- Site selector
- User filter (my submissions)
- Clear filters button

### File: `src/components/form-builder/submissions/SubmissionTable.tsx`
**Purpose**: Table component for submissions
**Features**:
- Sortable columns
- Pagination controls
- Row selection (for bulk actions)
- Export button

### File: `src/components/form-builder/submissions/SubmissionDetail.tsx`
**Purpose**: View single submission detail
**Features**:
- Display form data (read-only)
- Current state badge
- Available actions buttons
- Workflow history timeline
- Print/Export buttons

### File: `src/components/form-builder/submissions/WorkflowActions.tsx`
**Purpose**: Action buttons for workflow transitions
**Features**:
- Dynamic buttons based on available actions
- Permission checks
- Comment modal for reject action
- Confirmation dialogs

### File: `src/components/form-builder/submissions/WorkflowHistory.tsx`
**Purpose**: Timeline of workflow transitions
**Features**:
- Chronological list
- Actor info with avatar
- Transition details (from → to)
- Comments display
- Timestamps

### File: `src/components/form-builder/submissions/CommentModal.tsx`
**Purpose**: Modal for entering comments
**Features**:
- Textarea for comment
- Required field validation
- Cancel/Submit buttons

**Estimated Time**: 8-10 hours
**Dependencies**: Phase 2, Phase 3
**Priority**: MEDIUM

---

## 🛠️ Phase 5: Admin Routes

### File: `src/routes/admin/forms/index.tsx`
**Purpose**: List all forms (admin view)
**Features**:
- Table of all forms
- Search bar
- Filter by module
- Create new form button
- Edit/Delete/Preview actions

**Code Structure**:
```tsx
export default component$(() => {
  const forms = useSignal<AppForm[]>([]);
  const loading = useSignal(false);
  const searchQuery = useSignal('');

  useVisibleTask$(async () => {
    loading.value = true;
    forms.value = await formBuilderService.getAllForms();
    loading.value = false;
  });

  const filteredForms = computed$(() => {
    return forms.value.filter(f =>
      f.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });

  return (
    <div class="max-w-7xl mx-auto p-6">
      <header class="mb-6">
        <h1 class="text-2xl font-bold">Form Management</h1>
        <Link href="/admin/forms/new" class="btn-primary">+ Create New Form</Link>
      </header>

      <input
        type="search"
        value={searchQuery.value}
        onInput$={(e) => searchQuery.value = e.target.value}
        placeholder="Search forms..."
        class="mb-4"
      />

      <FormTable forms={filteredForms.value} />
    </div>
  );
});
```

### File: `src/routes/admin/forms/new/index.tsx`
**Purpose**: Create new form
**Features**:
- Render FormBuilder component
- Load modules & workflows
- Save form and redirect

### File: `src/routes/admin/forms/[formCode]/index.tsx`
**Purpose**: Edit existing form
**Features**:
- Load form by code
- Render FormBuilder with initial data
- Save updates

### File: `src/routes/admin/forms/[formCode]/preview/index.tsx`
**Purpose**: Preview form before publishing
**Features**:
- Render FormRenderer in preview mode
- Show sample data
- No actual submission

### File: `src/routes/admin/workflows/index.tsx`
**Purpose**: Manage workflows
**Features**:
- List all workflows
- Create/Edit/Delete
- Render WorkflowDesigner

**Estimated Time**: 4-6 hours
**Dependencies**: Phase 2, Phase 3
**Priority**: HIGH

---

## 👥 Phase 6: User Routes

### File: `src/routes/business/[code]/forms/index.tsx`
**Purpose**: List forms available for business
**Features**:
- Load forms for business vertical
- Group by module
- Card-based layout
- Click to open form

**Code Structure**:
```tsx
export default component$(() => {
  const params = useLocation().params;
  const businessCode = params.code;
  const forms = useSignal<AppFormDTO[]>([]);

  useVisibleTask$(async () => {
    forms.value = await formBuilderService.getFormsForBusiness(businessCode);
  });

  const formsByModule = computed$(() => {
    const grouped: Record<string, AppFormDTO[]> = {};
    forms.value.forEach(form => {
      if (!grouped[form.module]) grouped[form.module] = [];
      grouped[form.module].push(form);
    });
    return grouped;
  });

  return (
    <div class="max-w-7xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6">Available Forms</h1>

      {Object.entries(formsByModule.value).map(([module, moduleForms]) => (
        <div key={module} class="mb-8">
          <h2 class="text-xl font-semibold mb-4">{module}</h2>
          <div class="grid grid-cols-3 gap-4">
            {moduleForms.map(form => (
              <Link
                href={`/business/${businessCode}/forms/${form.code}`}
                class="p-4 border rounded-lg hover:shadow-lg"
              >
                <h3 class="font-medium">{form.title}</h3>
                <p class="text-sm text-gray-600">{form.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
```

### File: `src/routes/business/[code]/forms/[formCode]/index.tsx`
**Purpose**: Submit a form
**Features**:
- Render FormRenderer
- Handle submission
- Auto-submit workflow action
- Success message

### File: `src/routes/business/[code]/submissions/index.tsx`
**Purpose**: List submissions for business
**Features**:
- Render SubmissionList
- Filter controls
- Click to view detail

### File: `src/routes/business/[code]/submissions/[submissionId]/index.tsx`
**Purpose**: View submission detail
**Features**:
- Render SubmissionDetail
- Workflow actions
- History timeline

**Estimated Time**: 4-6 hours
**Dependencies**: Phase 3, Phase 4
**Priority**: HIGH

---

## 🎨 Phase 7: UI Components Library

### File: `src/components/ui/Button.tsx`
**Purpose**: Reusable button component
**Variants**: primary, secondary, danger, ghost

### File: `src/components/ui/Input.tsx`
**Purpose**: Reusable input component
**Features**: validation, error states, icons

### File: `src/components/ui/Modal.tsx`
**Purpose**: Reusable modal dialog
**Features**: backdrop, close button, header/footer

### File: `src/components/ui/Badge.tsx`
**Purpose**: Status badge component
**Variants**: draft, submitted, approved, rejected

### File: `src/components/ui/Card.tsx`
**Purpose**: Card container component
**Features**: header, body, footer sections

### File: `src/components/ui/DataTable.tsx`
**Purpose**: Reusable data table
**Features**: sorting, pagination, selection

**Estimated Time**: 3-4 hours
**Dependencies**: None
**Priority**: MEDIUM

---

## 🧪 Phase 8: Testing

### Unit Tests
- [ ] `FormBuilder.test.tsx` - Form builder component tests
- [ ] `FieldEditor.test.tsx` - Field editor tests
- [ ] `WorkflowDesigner.test.tsx` - Workflow designer tests
- [ ] `FormRenderer.test.tsx` - Form renderer tests
- [ ] `workflow.service.test.ts` - Workflow service tests
- [ ] `form-builder.service.test.ts` - Form builder service tests

### Integration Tests
- [ ] `form-creation.spec.ts` - E2E form creation flow
- [ ] `form-submission.spec.ts` - E2E form submission flow
- [ ] `workflow-approval.spec.ts` - E2E approval workflow

**Estimated Time**: 6-8 hours
**Dependencies**: All phases
**Priority**: MEDIUM

---

## 📚 Phase 9: Documentation

### User Documentation
- [ ] Form builder user guide
- [ ] Workflow designer guide
- [ ] Submission management guide
- [ ] Video tutorials

### Developer Documentation
- [ ] API integration guide
- [ ] Component API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

**Estimated Time**: 4-6 hours
**Dependencies**: All phases
**Priority**: LOW

---

## 📊 Implementation Timeline

| Phase | Description | Time | Priority | Status |
|-------|-------------|------|----------|--------|
| 1 | Core Infrastructure | 4h | HIGH | ✅ COMPLETE |
| 2 | Workflow Designer | 8h | HIGH | ⏳ TODO |
| 3 | Form Rendering | 12h | HIGH | ⏳ TODO |
| 4 | Submission Management | 10h | MEDIUM | ⏳ TODO |
| 5 | Admin Routes | 6h | HIGH | ⏳ TODO |
| 6 | User Routes | 6h | HIGH | ⏳ TODO |
| 7 | UI Components | 4h | MEDIUM | ⏳ TODO |
| 8 | Testing | 8h | MEDIUM | ⏳ TODO |
| 9 | Documentation | 6h | LOW | ⏳ TODO |

**Total Estimated Time**: 64 hours (~8 days at 8 hours/day)

**Current Progress**: Phase 1 Complete (6% total)

---

## 🚀 Quick Start for Next Phase

### To implement Phase 2 (Workflow Designer):

1. Create directory:
   ```bash
   mkdir -p src/components/form-builder/workflow
   ```

2. Create files in order:
   - `WorkflowDesigner.tsx` (main container)
   - `StateEditor.tsx` (edit states)
   - `TransitionEditor.tsx` (edit transitions)
   - `WorkflowDiagram.tsx` (optional visual)

3. Start with `WorkflowDesigner.tsx`:
   ```tsx
   import { component$, useStore, useSignal } from '@builder.io/qwik';
   import type { WorkflowDefinition } from '~/types/workflow';
   import StateEditor from './StateEditor';
   import TransitionEditor from './TransitionEditor';

   export default component$(() => {
     const workflow = useStore<WorkflowDefinition>({
       code: '',
       name: '',
       initial_state: 'draft',
       states: [],
       transitions: [],
     });

     return (
       <div class="workflow-designer">
         {/* Implementation */}
       </div>
     );
   });
   ```

4. Test as you build:
   ```bash
   pnpm dev
   # Navigate to /admin/workflows
   ```

---

## 💡 Pro Tips

1. **Build incrementally**: Complete one file before moving to the next
2. **Test frequently**: Run `pnpm dev` and test in browser after each component
3. **Reuse patterns**: Copy structure from existing components (FormBuilder, FieldEditor)
4. **Use TypeScript**: Let types guide you - they're already defined!
5. **Component composition**: Break large components into smaller ones
6. **Error handling**: Add try-catch in all async operations
7. **Loading states**: Always show loading spinners during API calls
8. **Accessibility**: Add aria-labels and keyboard navigation

---

## 📞 Support & Questions

If you need help:
1. Check existing components (FormBuilder, FieldEditor) for patterns
2. Review type definitions in `src/types/workflow.ts`
3. Test API endpoints using browser DevTools
4. Refer to backend docs at `backend/v1/docs/WORKFLOW_SYSTEM_IMPLEMENTATION.md`

Happy coding! 🎉
