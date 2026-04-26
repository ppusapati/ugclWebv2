# Form Access And Workflow Help

This guide explains how to define a new form when the form belongs to a business vertical and module, and also needs approval, rejection, revise, or multi-level approval.

## Core Rule

Do not define access by selecting roles directly as the primary control.

Use this split instead:

- The form defines the permission required to use it.
- Roles are assigned those permissions in RBAC.
- The workflow defines which permission is required for each review action.

This keeps the form reusable even when roles change later.

## What To Define On The Form

For each new form, define these fields:

| Field | Purpose | Example |
|---|---|---|
| `module` | Module the form belongs to | `project_management` |
| `accessible_verticals` | Business verticals that can use the form | `['solar', 'water']` |
| `required_permission` | Permission required to open/create/submit the form | `maintenance_report:submit` |
| `allowed_roles` | Optional UI filter for roles that should see the form | `['contractor', 'site_engineer']` |
| `workflow` or `workflow_id` | Approval flow for the form after submission | `maintenance-report-approval-v1` |

## Recommended Access Model

Use `required_permission` as the main access control.

Use `allowed_roles` only when you want an additional explicit restriction at form level. Do not rely on roles alone, because that couples the form definition to a changing role list.

Preferred model:

```text
Form -> required_permission
Role -> assigned permissions
User -> assigned roles
Workflow transition -> transition permission
```

## Example Role Setup

Suppose you have these roles:

- `contractor`
- `project_coordinator`
- `site_engineer`
- `supervisor`
- `asst_manager`
- `manager`

For a form such as a maintenance report, assign permissions like this:

| Role | Permissions |
|---|---|
| `contractor` | `maintenance_report:submit` |
| `site_engineer` | `maintenance_report:submit` |
| `project_coordinator` | `maintenance_report:submit`, `maintenance_report:supervisor_review` |
| `supervisor` | `maintenance_report:supervisor_review` |
| `asst_manager` | `maintenance_report:asst_manager_review` |
| `manager` | `maintenance_report:manager_approve` |

## Example Form Definition Strategy

Use the form definition for who can create or submit the form.

Example:

```json
{
  "form_code": "maintenance_report",
  "title": "Maintenance Report",
  "module": "project_management",
  "accessible_verticals": ["solar"],
  "required_permission": "maintenance_report:submit",
  "allowed_roles": ["contractor", "site_engineer", "project_coordinator"]
}
```

In this setup:

- Contractors and site engineers can fill and submit the form.
- Approval is not controlled here.
- Approval is controlled by the workflow transitions.

## How To Define The Workflow

For approval, rejection, revise, and multi-level approval, define explicit workflow states and transitions.

### Recommended States

- `draft`
- `submitted`
- `supervisor_review`
- `asst_manager_review`
- `manager_review`
- `approved`
- `rejected`
- `revised`

### State Meaning

| State | Meaning |
|---|---|
| `draft` | User is still preparing the form |
| `submitted` | Form has been submitted into the approval process |
| `supervisor_review` | First review level |
| `asst_manager_review` | Second review level |
| `manager_review` | Final review level |
| `approved` | Final approved state |
| `rejected` | Final rejected state |
| `revised` | Sent back for correction and resubmission |

## Example Workflow Transition Design

Each transition should use a permission, not a role name.

```json
{
  "initial_state": "draft",
  "states": [
    { "code": "draft", "name": "Draft" },
    { "code": "submitted", "name": "Submitted" },
    { "code": "supervisor_review", "name": "Supervisor Review" },
    { "code": "asst_manager_review", "name": "Assistant Manager Review" },
    { "code": "manager_review", "name": "Manager Review" },
    { "code": "approved", "name": "Approved", "is_final": true },
    { "code": "rejected", "name": "Rejected", "is_final": true },
    { "code": "revised", "name": "Revision Requested" }
  ],
  "transitions": [
    {
      "from": "draft",
      "to": "submitted",
      "action": "submit",
      "label": "Submit",
      "permission": "maintenance_report:submit"
    },
    {
      "from": "submitted",
      "to": "supervisor_review",
      "action": "start_review",
      "label": "Start Review",
      "permission": "maintenance_report:supervisor_review"
    },
    {
      "from": "supervisor_review",
      "to": "asst_manager_review",
      "action": "approve_l1",
      "label": "Approve Level 1",
      "permission": "maintenance_report:supervisor_review"
    },
    {
      "from": "supervisor_review",
      "to": "revised",
      "action": "request_revision",
      "label": "Request Revision",
      "permission": "maintenance_report:supervisor_review",
      "requires_comment": true
    },
    {
      "from": "supervisor_review",
      "to": "rejected",
      "action": "reject",
      "label": "Reject",
      "permission": "maintenance_report:supervisor_review",
      "requires_comment": true
    },
    {
      "from": "asst_manager_review",
      "to": "manager_review",
      "action": "approve_l2",
      "label": "Approve Level 2",
      "permission": "maintenance_report:asst_manager_review"
    },
    {
      "from": "asst_manager_review",
      "to": "revised",
      "action": "request_revision",
      "label": "Request Revision",
      "permission": "maintenance_report:asst_manager_review",
      "requires_comment": true
    },
    {
      "from": "asst_manager_review",
      "to": "rejected",
      "action": "reject",
      "label": "Reject",
      "permission": "maintenance_report:asst_manager_review",
      "requires_comment": true
    },
    {
      "from": "manager_review",
      "to": "approved",
      "action": "approve_final",
      "label": "Final Approve",
      "permission": "maintenance_report:manager_approve"
    },
    {
      "from": "manager_review",
      "to": "revised",
      "action": "request_revision",
      "label": "Request Revision",
      "permission": "maintenance_report:manager_approve",
      "requires_comment": true
    },
    {
      "from": "manager_review",
      "to": "rejected",
      "action": "reject",
      "label": "Reject",
      "permission": "maintenance_report:manager_approve",
      "requires_comment": true
    },
    {
      "from": "revised",
      "to": "submitted",
      "action": "resubmit",
      "label": "Resubmit",
      "permission": "maintenance_report:submit"
    }
  ]
}
```

## How Multi Approval Should Be Modeled

If you need more than one approval level, do not overload one state with multiple approvers.

Instead, create separate review states such as:

- `supervisor_review`
- `asst_manager_review`
- `manager_review`

If two managers must both approve, create separate sequential states such as:

- `manager_review_1`
- `manager_review_2`

Each state should have its own transition permission.

## Approval, Rejection, And Revision Rules

- Approval moves the submission to the next review state or final approved state.
- Rejection should go to a final `rejected` state.
- Revision should move to `revised` and require comments.
- Resubmission should move from `revised` back to `submitted`.

## Practical Recommendation

When creating a new form:

1. Select the module.
2. Select the business verticals.
3. Set one main `required_permission` for submitting the form.
4. Optionally restrict with `allowed_roles` if needed.
5. Attach a workflow.
6. Define transition permissions for each review step.
7. Assign those permissions to roles in RBAC.

## Final Recommendation

Use this pattern consistently:

- Form access: permission-driven
- Role mapping: managed in RBAC
- Approval flow: workflow transition permissions
- Business scope: `accessible_verticals`
- Multi approval: separate workflow states per approval level

This is the most stable model for contractor, engineer, supervisor, assistant manager, manager, and future roles.