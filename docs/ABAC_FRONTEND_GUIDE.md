# ABAC Frontend Implementation Guide

## ✅ What's Been Created

### **1. Policy Management Dashboard** - COMPLETE

**Location**: `src/routes/admin/policies/index.tsx`

**Features**:
- ✅ Policy list with filtering (status, effect, search)
- ✅ Statistics cards showing policy metrics
- ✅ Activate/Deactivate policies
- ✅ Delete policies
- ✅ Navigate to view/edit/test pages
- ✅ Pagination support
- ✅ Responsive design with Tailwind CSS

**API Integration**:
- GET `/api/v1/policies` - List policies
- GET `/api/v1/policies/statistics` - Get statistics
- POST `/api/v1/policies/{id}/activate` - Activate policy
- POST `/api/v1/policies/{id}/deactivate` - Deactivate policy
- DELETE `/api/v1/policies/{id}` - Delete policy

---

## 🚀 How to Use

### **Access the Dashboard**

1. Start your backend:
```bash
cd D:\Maheshwari\UGCL\backend\v1
go run main.go
```

2. Start your frontend:
```bash
cd D:\Maheshwari\UGCL\web\v1
npm run dev
```

3. Navigate to: `http://localhost:5173/admin/policies`

### **Environment Setup**

Make sure your `.env` file has:

```env
PUBLIC_API_URL=http://localhost:8080/api/v1
PUBLIC_API_KEY=your-api-key
```

---

## 📋 Next Components to Build

### **Priority 1: Core Pages** (Recommended Order)

1. **Policy Detail Page** (`/admin/policies/[id]/index.tsx`)
   - View complete policy details
   - Show conditions in readable format
   - Version history
   - Evaluation logs

2. **Policy Create/Edit Form** (`/admin/policies/create/index.tsx`)
   - Form for basic policy info
   - Visual condition builder
   - Actions/Resources selector
   - Priority & status settings

3. **Policy Testing Tool** (`/admin/policies/[id]/test/index.tsx`)
   - Test policy against scenarios
   - Input user/resource/environment attributes
   - See evaluation results
   - Debug tool

### **Priority 2: Attribute Management**

4. **Attribute List Page** (`/admin/attributes/index.tsx`)
   - List all system & custom attributes
   - Filter by type (user, resource, environment)
   - Create/edit/delete attributes

5. **User Attribute Assignment** (`/admin/users/[id]/attributes/index.tsx`)
   - Assign attributes to users
   - Bulk assignment
   - View history

### **Priority 3: Approval Workflow**

6. **Approval Requests Page** (`/admin/approvals/index.tsx`)
   - List pending approvals
   - My pending approvals
   - Approve/reject interface

7. **Policy Version History** (`/admin/policies/[id]/versions/index.tsx`)
   - List all versions
   - Compare versions
   - Rollback capability

### **Priority 4: Audit & Analytics**

8. **Audit Log Viewer** (`/admin/audit/policies/index.tsx`)
   - Policy evaluation logs
   - Filter by user/resource/time
   - Export capabilities

9. **Policy Analytics Dashboard** (`/admin/analytics/policies/index.tsx`)
   - Charts & graphs
   - Policy effectiveness metrics
   - Usage trends

---

## 🎨 Component Structure

### **Recommended Component Organization**

```
src/
├── routes/
│   └── admin/
│       ├── policies/
│       │   ├── index.tsx                    ✅ DONE
│       │   ├── create/
│       │   │   └── index.tsx               (Next)
│       │   └── [id]/
│       │       ├── index.tsx               (Next - Detail View)
│       │       ├── edit/
│       │       │   └── index.tsx
│       │       ├── test/
│       │       │   └── index.tsx           (Next - Testing Tool)
│       │       ├── versions/
│       │       │   └── index.tsx
│       │       └── changelog/
│       │           └── index.tsx
│       ├── attributes/
│       │   └── index.tsx
│       ├── approvals/
│       │   └── index.tsx
│       └── audit/
│           └── policies/
│               └── index.tsx
│
└── components/
    ├── policy/
    │   ├── condition-builder.tsx          (Visual builder)
    │   ├── policy-card.tsx
    │   ├── policy-form.tsx
    │   └── policy-tester.tsx
    ├── attribute/
    │   ├── attribute-selector.tsx
    │   ├── attribute-form.tsx
    │   └── attribute-assignment.tsx
    └── approval/
        ├── approval-card.tsx
        ├── approval-form.tsx
        └── approval-timeline.tsx
```

---

## 💡 Implementation Tips

### **1. API Helper**

Create a centralized API helper:

```typescript
// src/utils/policy-api.ts
import { getToken } from '~/utils/auth';

const API_URL = import.meta.env.PUBLIC_API_URL;
const API_KEY = import.meta.env.PUBLIC_API_KEY;

export const policyAPI = {
  async list(params: any) {
    const token = getToken();
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_URL}/policies?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY
      }
    });
    if (!response.ok) throw new Error('Failed to fetch policies');
    return response.json();
  },

  async get(id: string) {
    const token = getToken();
    const response = await fetch(`${API_URL}/policies/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY
      }
    });
    if (!response.ok) throw new Error('Failed to fetch policy');
    return response.json();
  },

  async create(policy: any) {
    const token = getToken();
    const response = await fetch(`${API_URL}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY
      },
      body: JSON.stringify(policy)
    });
    if (!response.ok) throw new Error('Failed to create policy');
    return response.json();
  },

  // ... more methods
};
```

### **2. TypeScript Interfaces**

Create shared types:

```typescript
// src/types/policy.ts
export interface Policy {
  id: string;
  name: string;
  display_name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  conditions: PolicyCondition;
  actions: string[];
  resources: string[];
  business_vertical_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyCondition {
  AND?: PolicyCondition[];
  OR?: PolicyCondition[];
  NOT?: PolicyCondition;
  attribute?: string;
  operator?: string;
  value?: any;
}

export interface Attribute {
  id: string;
  name: string;
  display_name: string;
  type: 'user' | 'resource' | 'environment' | 'action';
  data_type: 'string' | 'integer' | 'float' | 'boolean';
  is_system: boolean;
}
```

### **3. Condition Builder Component**

The condition builder is the most complex component. Here's a starting structure:

```typescript
// src/components/policy/condition-builder.tsx
import { component$, useSignal } from '@builder.io/qwik';

export interface ConditionBuilderProps {
  condition: any;
  onChange$: (condition: any) => void;
  attributes: Attribute[];
}

export const ConditionBuilder = component$<ConditionBuilderProps>((props) => {
  const conditionType = useSignal('simple'); // 'simple' or 'complex'

  return (
    <div class="space-y-4">
      {/* Logic Type Selector */}
      <div class="flex gap-2">
        <button
          onClick$={() => conditionType.value = 'simple'}
          class={`px-4 py-2 rounded ${conditionType.value === 'simple' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
        >
          Simple Condition
        </button>
        <button
          onClick$={() => conditionType.value = 'complex'}
          class={`px-4 py-2 rounded ${conditionType.value === 'complex' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
        >
          Complex (AND/OR/NOT)
        </button>
      </div>

      {/* Condition Editor */}
      {conditionType.value === 'simple' ? (
        <SimpleCondition
          attributes={props.attributes}
          onChange$={props.onChange$}
        />
      ) : (
        <ComplexCondition
          condition={props.condition}
          attributes={props.attributes}
          onChange$={props.onChange$}
        />
      )}
    </div>
  );
});
```

---

## 🎯 Quick Wins

### **Easiest Components to Build First**:

1. **Policy Detail View** - Just display data, no complex logic
2. **Attribute List** - Similar to policy list, simpler data
3. **User Attribute Assignment** - Form with dropdowns

### **Most Impactful Components**:

1. **Policy Create Form** - Enables policy creation
2. **Policy Testing Tool** - Critical for testing
3. **Approval Workflow** - Core workflow feature

---

## 🔗 Navigation Integration

### **Update Sidebar Menu**

Find your sidebar component (likely `src/components/layout2/sidebar/index.tsx` or similar) and add:

```typescript
{
  title: 'Policies',
  icon: ShieldIcon,
  path: '/admin/policies',
  children: [
    { title: 'All Policies', path: '/admin/policies' },
    { title: 'Create Policy', path: '/admin/policies/create' },
    { title: 'Attributes', path: '/admin/attributes' },
    { title: 'Approvals', path: '/admin/approvals' },
    { title: 'Audit Logs', path: '/admin/audit/policies' },
  ]
}
```

---

## 📊 Testing Checklist

Before deploying, test:

- [ ] Policy list loads correctly
- [ ] Filters work (status, effect, search)
- [ ] Statistics display correctly
- [ ] Activate/Deactivate functions work
- [ ] Delete function works with confirmation
- [ ] Pagination works
- [ ] Navigation to other pages works
- [ ] Error handling displays properly
- [ ] Loading states show correctly
- [ ] Mobile responsive

---

## 🐛 Common Issues & Solutions

### **Issue: API calls fail with CORS**
**Solution**: Make sure your backend has CORS enabled for your frontend URL

### **Issue: Authentication errors**
**Solution**: Check that JWT token is being sent correctly in headers

### **Issue: Environment variables not loading**
**Solution**: Restart dev server after changing `.env` file

### **Issue: Styling not applied**
**Solution**: Make sure Tailwind CSS is configured and imported

---

## 📚 Resources

- **Backend API Docs**: See `backend/v1/docs/ABAC_IMPLEMENTATION_GUIDE.md`
- **Policy Examples**: See `backend/v1/docs/POLICY_EXAMPLES.md`
- **Database Schema**: See `backend/v1/docs/abac_schema.md`
- **Qwik Docs**: https://qwik.builder.io/docs/

---

## 🎉 What's Next?

You now have a fully functional **Policy Management Dashboard**!

**Recommended next steps**:

1. **Test the dashboard** - Access `/admin/policies` and verify it works
2. **Create Policy Detail page** - View individual policy details
3. **Build Policy Form** - Enable policy creation
4. **Add to sidebar** - Make it accessible from navigation

Would you like me to build the next component? Options:
1. Policy Detail View (easiest)
2. Policy Create/Edit Form (most useful)
3. Policy Testing Tool (most fun)
4. Attribute Management (independent module)

Just let me know which one to build next! 🚀
