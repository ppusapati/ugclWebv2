# Form Builder - Quick Start Guide

## 🚀 5-Minute Quick Start

### Step 1: Start the Application

```bash
# Frontend
cd D:\Maheshwari\UGCL\web\v1
pnpm dev

# Backend (in another terminal)
cd D:\Maheshwari\UGCL\backend\v1
go run .
```

Access at: http://localhost:5173

---

## 📋 Common Tasks

### Task 1: Create a New Workflow (1 minute)

1. Go to http://localhost:5173/admin/workflows
2. Click **"Create New Workflow"**
3. Fill in:
   - Code: `approval_workflow`
   - Name: `Standard Approval`
   - Initial State: `draft`
4. Click **"Info"** tab, then **"States"** tab
5. Add states:
   - `draft` (not final)
   - `submitted` (not final)
   - `approved` (final)
   - `rejected` (final)
6. Click **"Transitions"** tab
7. Add transitions:
   - draft → submitted (action: `submit`)
   - submitted → approved (action: `approve`, permission: `project:approve`)
   - submitted → rejected (action: `reject`, permission: `project:approve`, requires comment)
8. Click **"Save Workflow"**

✅ **Done! Workflow created.**

---

### Task 2: Create a New Form (2 minutes)

1. Go to http://localhost:5173/admin/forms
2. Click **"Create New Form"**
3. **Basic Info tab:**
   - Form Code: `project_request`
   - Title: `Project Request Form`
   - Description: `Submit a new project request`
   - Module: Select from dropdown
   - Type: `Multi-Step`
4. **Steps & Fields tab:**
   - Click **"Add Step"**
   - Step Title: `Project Details`
   - Click **"Add Field"** to this step
   - Configure field:
     - Type: `text`
     - Label: `Project Name`
     - Required: ✓
   - Add more fields as needed (description, budget, timeline, etc.)
5. **Workflow tab:**
   - Select the workflow you created: `approval_workflow`
6. Click **"Save Form"**

✅ **Done! Form created.**

---

### Task 3: Submit a Form (1 minute)

1. Go to http://localhost:5173/business/ugcl/forms
2. Click on **"Project Request Form"**
3. Fill in the fields:
   - Project Name: `New Solar Installation`
   - Description: `Install solar panels at Site A`
   - Budget: `500000`
4. Click **"Next"** to navigate between steps
5. Click **"Submit"** on the last step

✅ **Done! Form submitted.**

---

### Task 4: Approve a Submission (30 seconds)

1. Go to http://localhost:5173/business/ugcl/submissions
2. Select form: `Project Request Form`
3. You'll see the submission with status **"Submitted"** (blue badge)
4. Click on the submission to view details
5. Review the data
6. Click **"Approve"** button
7. Confirm

✅ **Done! Submission approved.**

---

## 🎯 Route Reference

### Admin Routes

| Route | Purpose |
|-------|---------|
| `/admin/forms` | View all forms |
| `/admin/forms/new` | Create new form |
| `/admin/forms/{code}` | Edit form |
| `/admin/forms/{code}/preview` | Preview form |
| `/admin/workflows` | Manage workflows |

### User Routes

| Route | Purpose |
|-------|---------|
| `/business/{code}/forms` | Browse available forms |
| `/business/{code}/forms/{formCode}` | Submit a form |
| `/business/{code}/submissions` | View my submissions |
| `/business/{code}/submissions/{id}` | Submission detail |

Replace `{code}` with your business code (e.g., `ugcl`, `solar`, etc.)

---

## 🔧 Common Operations

### Import a Form from JSON

```typescript
// In browser console or admin page
const formJson = {
  "form_code": "my_form",
  "title": "My Form",
  "type": "multi_step",
  "steps": [...]
};

await formBuilderService.importFormDefinition(formJson);
```

**Or use the UI:**
1. Go to `/admin/forms/new`
2. Click **"JSON Editor"** tab
3. Paste your JSON
4. Click **"Import & Validate"**
5. Click **"Save Form"**

### Export a Form to JSON

1. Go to `/admin/forms/{code}`
2. Click **"JSON Editor"** tab
3. Click **"Export JSON"**
4. Copy the JSON from the text area

### Filter Submissions

1. Go to `/business/ugcl/submissions`
2. Use the filters:
   - **Form**: Select which form's submissions to view
   - **State**: Filter by draft, submitted, approved, rejected
   - **My Submissions**: Toggle to see only your submissions
3. Use search box to find specific submissions

---

## 🎨 Field Types Reference

| Type | Use For | Example |
|------|---------|---------|
| `text` | Short text | Name, Title |
| `textarea` | Long text | Description, Notes |
| `number` | Numeric values | Budget, Quantity |
| `email` | Email addresses | Contact Email |
| `phone` | Phone numbers | Mobile Number |
| `date` | Dates | Project Start Date |
| `datetime` | Date + Time | Appointment |
| `time` | Time only | Meeting Time |
| `radio` | Single choice | Yes/No |
| `checkbox` | Multiple choices | Features |
| `dropdown` | Select from list | Category |
| `file_upload` | Files/Images | Documents |
| `signature` | Digital signature | Approval |
| `location` | GPS coordinates | Site Location |

---

## 🔐 Permission-Based Actions

Workflows can restrict actions based on permissions:

```javascript
// Example transition configuration
{
  from_state: 'submitted',
  to_state: 'approved',
  action: 'approve',
  permission: 'project:approve',  // Only users with this permission
  requires_comment: false
}
```

**Common Permissions:**
- `project:create` - Create new projects
- `project:approve` - Approve submissions
- `project:view` - View submissions
- `admin:full` - Full admin access

---

## 💡 Tips & Tricks

### Tip 1: Use Conditional Fields
Make fields visible based on other field values:

```json
{
  "id": "budget_details",
  "type": "textarea",
  "label": "Budget Details",
  "visible": {
    "field": "needs_budget",
    "operator": "equals",
    "value": "yes"
  }
}
```

### Tip 2: Save Drafts
Users can save incomplete forms as drafts:
- Click **"Save Draft"** instead of Submit
- Resume later from submissions list

### Tip 3: Multi-Step Forms
Break long forms into logical steps:
- Step 1: Basic Info
- Step 2: Details
- Step 3: Attachments
- Step 4: Review

### Tip 4: Required Comments
Force users to provide reasons for certain actions:

```json
{
  "from_state": "submitted",
  "to_state": "rejected",
  "action": "reject",
  "requires_comment": true  // User must enter a comment
}
```

### Tip 5: Use Field Validation
Add validation rules to ensure data quality:

```json
{
  "id": "budget",
  "type": "number",
  "label": "Budget",
  "min": 1000,
  "max": 10000000,
  "validation": {
    "pattern": "^\\d+$",
    "message": "Budget must be a positive number"
  }
}
```

---

## 🐛 Troubleshooting

### Issue: Form not showing in submissions
**Solution:** Make sure the form is:
- Active (`is_active: true`)
- Has correct vertical access for your business code
- Linked to a workflow (if using workflow features)

### Issue: Can't approve submission
**Solution:** Check:
- User has the required permission (`project:approve`)
- Current state allows the transition
- Workflow is configured correctly

### Issue: File upload failing
**Solution:** Verify:
- File size is within limits
- File type is allowed (check `accept` field)
- Backend file service is running

### Issue: Validation errors
**Solution:**
- Check required fields are filled
- Verify field values meet min/max constraints
- Ensure pattern validation matches

---

## 📞 Need Help?

### Documentation
- [Complete Implementation Guide](./FORM_BUILDER_COMPLETE.md)
- [Component Documentation](./docs/FORM_BUILDER_IMPLEMENTATION.md)
- [Backend API Docs](../backend/v1/docs/WORKFLOW_SYSTEM_IMPLEMENTATION.md)

### Example Forms
Check `backend/v1/form_definitions/` for examples:
- `water.json` - Water tanker tracking
- Import these as templates

### Debug Mode
Enable debug logging:
```typescript
// In browser console
localStorage.setItem('debug', 'form-builder:*');
```

---

## 🎉 You're Ready!

You now know how to:
- ✅ Create workflows
- ✅ Build forms
- ✅ Submit forms
- ✅ Approve/reject submissions
- ✅ Track workflow history
- ✅ Use all 14 field types
- ✅ Configure permissions
- ✅ Troubleshoot issues

**Start building your forms now!** 🚀
