# Report Builder Frontend - Quick Setup Guide

## ✅ What's Already Done

All frontend screens have been created in Qwik format at:
```
D:\Maheshwari\UGCL\web\v1\src\routes\analytics\
```

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Files Exist

Check that these files were created:
```bash
cd D:\Maheshwari\UGCL\web\v1

# Check files
ls src/routes/analytics/reports/index.tsx
ls src/routes/analytics/reports/builder/index.tsx
ls src/routes/analytics/reports/view/[id]/index.tsx
ls src/routes/analytics/dashboards/index.tsx
```

### Step 2: Start Your Backend

```bash
cd D:\Maheshwari\UGCL\backend\v1
go run main.go
```

Backend should be running at: `http://localhost:8080`

### Step 3: Start Your Frontend

```bash
cd D:\Maheshwari\UGCL\web\v1
pnpm dev
```

Frontend should be running at: `http://localhost:5173`

### Step 4: Access Report Builder

Open your browser and navigate to:
```
http://localhost:5173/analytics/reports
```

## 📸 What You Should See

### 1. Reports List Page
```
┌─────────────────────────────────────────┐
│ 📊 Analytics Reports    [+ New Report] │
│                                         │
│ [🔍 Search reports...]                 │
│                                         │
│   No reports found                      │
│   Create your first report              │
│   [➕ Create Report]                    │
└─────────────────────────────────────────┘
```

### 2. Click "New Report" → Report Builder
```
┌──────────────────────────────────────────┐
│ [← Back] Report Builder  [Preview][Save] │
├──────┬───────────────────────────────────┤
│ Data │ Selected Fields                   │
│Source│ (Drag fields here)                │
│      │                                    │
│Fields│ 🔍 Filters                        │
│ List │ [Add filters...]                  │
└──────┴───────────────────────────────────┘
```

## 🎯 Create Your First Report

### Step-by-Step

1. **Navigate to Reports**
   ```
   http://localhost:5173/analytics/reports
   ```

2. **Click "➕ New Report"**

3. **Select a Data Source**
   - Click the dropdown under "📊 Data Source"
   - Select any form table (e.g., "Site Inspections")

4. **Add Fields**
   - Click on fields from the left sidebar
   - They'll appear in "Selected Fields"

5. **Preview**
   - Click "👁 Preview" button
   - See results at the bottom

6. **Save**
   - Click "💾 Save Report"
   - Enter name: "My First Report"
   - Click Save

7. **View Your Report**
   - You'll be redirected to the viewer
   - See your data in a table
   - Try exporting to Excel!

## 🔧 Configuration

### Update API Base URL (if needed)

If your backend is not at `localhost:8080`, update the API calls in the screens:

```typescript
// In each screen file, find:
const response = await fetch('/api/v1/reports/...')

// Change to:
const response = await fetch('http://your-backend:8080/api/v1/reports/...')
```

Or create an API service file:

**Create**: `src/services/api.ts`
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = {
  get: (endpoint: string) =>
    fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }),

  post: (endpoint: string, data: any) =>
    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    })
};
```

### Set Environment Variable

**Create**: `.env.local`
```bash
VITE_API_URL=http://localhost:8080
```

## 🎨 Styling Customization

### Using DaisyUI Themes

Your app uses DaisyUI. To change themes, update your config:

**File**: `tailwind.config.js` or `unocss.config.ts`
```javascript
daisyui: {
  themes: ["light", "dark", "cupcake", "corporate"],
}
```

### Custom Colors

Edit your theme colors:
```typescript
theme: {
  extend: {
    colors: {
      'brand-primary': '#your-color',
      'brand-secondary': '#your-color',
    }
  }
}
```

## 📊 Integrating Charts

You already have ECharts installed! To add charts to reports:

### Option 1: Use Existing ECharts Component

Check if you have: `src/components/echarts/`

Import and use in Report Viewer:
```typescript
import { ECharts } from '~/components/echarts';

// In your component
{report.value?.report_type === 'chart' && (
  <ECharts
    option={{
      xAxis: { data: labels },
      yAxis: {},
      series: [{ type: 'bar', data: values }]
    }}
  />
)}
```

### Option 2: Add Chart.js

```bash
pnpm install chart.js react-chartjs-2
```

Create a chart component:
```typescript
// src/components/reports/ChartView.tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Chart } from 'chart.js/auto';

export const ChartView = component$(({ data, chartType }: any) => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  useVisibleTask$(() => {
    if (canvasRef.value) {
      new Chart(canvasRef.value, {
        type: chartType,
        data: {
          labels: data.labels,
          datasets: data.datasets
        }
      });
    }
  });

  return <canvas ref={canvasRef} />;
});
```

## 🔐 Authentication

The screens expect a token in localStorage. Make sure your auth flow sets:

```typescript
localStorage.setItem('token', 'your-jwt-token');
localStorage.setItem('business_vertical_id', 'your-vertical-id');
```

If you use a different auth method, update all API calls in the screen files.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Navigate to `/analytics/reports`
- [ ] Click "New Report"
- [ ] Select a data source
- [ ] Add fields
- [ ] Add a filter
- [ ] Click Preview
- [ ] Save the report
- [ ] View the report
- [ ] Export to Excel
- [ ] Delete the report

### Check API Responses

Open browser DevTools (F12) → Network tab:
- Should see API calls to `/api/v1/reports/...`
- Check responses are 200 OK
- Verify JSON data structure

## 🐛 Troubleshooting

### Issue: Blank Page
**Solution**: Check browser console for errors
```javascript
// Common fix: CORS issue
// Add to your backend main.go:
router.Use(cors.Default())
```

### Issue: "Failed to load reports"
**Solution**:
1. Check backend is running: `curl http://localhost:8080/api/v1/reports/forms/tables`
2. Check token exists: `console.log(localStorage.getItem('token'))`
3. Check business_vertical_id: `console.log(localStorage.getItem('business_vertical_id'))`

### Issue: Fields not showing
**Solution**:
1. Ensure form tables exist in database
2. Check form has `db_table_name` set
3. Verify table was created via FormTableManager

### Issue: Export downloads empty file
**Solution**:
1. Check backend has excelize: `go get github.com/xuri/excelize/v2`
2. Check export routes are registered
3. Check Content-Type headers in response

## 📱 Mobile View

All screens are mobile-responsive. Test on:
- Chrome DevTools (F12 → Toggle device toolbar)
- Actual mobile device
- Tablet

Responsive breakpoints:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🎯 Next Features to Add

### 1. Dashboard Builder (30 min)
Create drag-and-drop dashboard with grid layout:
```bash
pnpm install react-grid-layout
```

### 2. Runtime Filters (20 min)
Add filter panel to report viewer for dynamic filtering

### 3. Chart Integration (15 min)
Use your existing ECharts component for visualizations

### 4. Report Scheduling UI (25 min)
Add modal for configuring scheduled reports

### 5. Report Templates (15 min)
Create pre-built report templates for quick start

## 📚 File Reference

| Screen | Path | Purpose |
|--------|------|---------|
| Reports List | `src/routes/analytics/reports/index.tsx` | Browse reports |
| Report Builder | `src/routes/analytics/reports/builder/index.tsx` | Create reports |
| Report Viewer | `src/routes/analytics/reports/view/[id]/index.tsx` | View & export |
| Dashboards | `src/routes/analytics/dashboards/index.tsx` | Dashboard list |

## 🎉 You're Ready!

Your report builder frontend is complete and ready to use. Just:

1. ✅ Start backend: `go run main.go`
2. ✅ Start frontend: `pnpm dev`
3. ✅ Open: `http://localhost:5173/analytics/reports`
4. ✅ Create your first report!

Need help? Check the full documentation:
- Backend API: `backend/v1/docs/REPORT_BUILDER_GUIDE.md`
- Screen Details: `web/v1/docs/REPORT_BUILDER_SCREENS.md`

Happy reporting! 📊🚀
