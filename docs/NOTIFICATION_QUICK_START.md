# Notification System - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run Migrations (Backend)

```bash
cd D:\Maheshwari\UGCL\backend\v1
go run . migrate
```

### Step 2: Add Notification Bell (Frontend)

```typescript
// D:\Maheshwari\UGCL\web\v1\src\components\navbar\navbar.tsx

import { NotificationBell } from '~/components/notifications/notification-bell';

export const Navbar = component$(() => {
  return (
    <nav class="bg-white shadow-sm">
      <div class="flex justify-between items-center px-4 h-16">
        <Logo />

        <div class="flex items-center gap-4">
          {/* Add this line */}
          <NotificationBell />

          <UserMenu />
        </div>
      </div>
    </nav>
  );
});
```

### Step 3: Add Notifications to Workflow

When creating a workflow, add notifications to transitions:

```json
{
  "transitions": [
    {
      "from": "draft",
      "to": "submitted",
      "action": "submit",
      "notifications": [
        {
          "recipients": [
            {"type": "permission", "permission_code": "project:approve"}
          ],
          "title_template": "New Submission: {{form_data.title}}",
          "body_template": "{{submitter_name}} submitted for approval",
          "priority": "high",
          "channels": ["in_app", "email"]
        }
      ]
    }
  ]
}
```

### Step 4: Test It!

1. Submit a form with a workflow
2. Perform a transition (approve/reject)
3. See notification in bell icon
4. Click notification to navigate

## 🎯 Recipient Targeting Cheat Sheet

```typescript
// Specific user
{type: "user", value: "user_123"}

// By role (RBAC)
{type: "role", role_id: "admin_role_uuid"}

// By business role
{type: "business_role", business_role_id: "manager_uuid"}

// By permission
{type: "permission", permission_code: "project:approve"}

// By attributes (ABAC)
{
  type: "attribute",
  attribute_query: {
    department: "engineering",
    location: "north"
  }
}

// Dynamic recipients
{type: "submitter"}          // Person who submitted
{type: "approver"}           // Person who approved
{type: "field_value", value: "assigned_to"}  // From form field
```

## 📝 Template Variables

```
{{form_title}}              - "Project Submission Form"
{{form_code}}               - "project_submission"
{{submitter_name}}          - "John Doe"
{{approver_name}}           - "Jane Smith"
{{current_state}}           - "submitted"
{{previous_state}}          - "draft"
{{action}}                  - "approve"
{{comment}}                 - "Looks good!"
{{form_data.field_name}}    - Any form field value
{{business_vertical}}       - "Solar Farms"
{{site_name}}               - "North Plant"
```

## 🔔 Priority Levels

```typescript
"low"      // Informational, no urgency
"normal"   // Standard workflow updates
"high"     // Requires attention
"critical" // Urgent, immediate action needed
```

## 📬 Delivery Channels

```typescript
"in_app"    // Notification bell (always enabled)
"email"     // Email notification
"sms"       // SMS notification
"web_push"  // Browser push notification
```

## 🔗 API Endpoints Quick Reference

```bash
# Get notifications
GET /api/v1/notifications

# Mark as read
PATCH /api/v1/notifications/:id/read

# Mark all as read
PATCH /api/v1/notifications/read-all

# Get unread count
GET /api/v1/notifications/unread-count

# Get preferences
GET /api/v1/notifications/preferences

# Update preferences
PUT /api/v1/notifications/preferences
```

## 📚 Full Documentation

- **Backend:** `backend/v1/docs/NOTIFICATION_SYSTEM_GUIDE.md`
- **Frontend:** `web/v1/docs/NOTIFICATION_FRONTEND_GUIDE.md`
- **Summary:** `web/v1/docs/NOTIFICATION_IMPLEMENTATION_SUMMARY.md`

## ✅ Checklist

- [ ] Migrations run successfully
- [ ] Notification bell added to navbar
- [ ] Browser permissions requested
- [ ] Test workflow has notifications
- [ ] Test notification creation
- [ ] Verify real-time updates
- [ ] Check notification bell updates
- [ ] Test mark as read
- [ ] Test navigation on click

## 🎉 You're Done!

Your notification system is now:
- ✅ Integrated with workflows
- ✅ Supporting RBAC/ABAC/PBAC
- ✅ Showing in real-time
- ✅ Fully functional!

---

Need help? Check the full documentation or review the example workflow at:
`backend/v1/docs/examples/workflow_with_notifications_example.json`
