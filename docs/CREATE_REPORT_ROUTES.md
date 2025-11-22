# Quick Guide: Create All Report Routes

All report routes follow the same pattern. For each report type, create 3 files:

## 1. List View: `/reports/[type]/index.tsx`

```typescript
import { component$ } from '@builder.io/qwik';
import { ReportList } from '~/components/reports/ReportList';

export default component$(() => {
  return <ReportList reportType="[TYPE]" />;
});
```

## 2. Create Form: `/reports/[type]/new/index.tsx`

```typescript
import { component$ } from '@builder.io/qwik';
import { ReportForm } from '~/components/reports/ReportForm';

export default component$(() => {
  return <ReportForm reportType="[TYPE]" />;
});
```

## 3. Edit Form: `/reports/[type]/[id]/edit/index.tsx`

```typescript
import { component$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { ReportForm } from '~/components/reports/ReportForm';

export default component$(() => {
  const loc = useLocation();
  const reportId = loc.params.id;

  return <ReportForm reportType="[TYPE]" reportId={reportId} />;
});
```

## Replace [TYPE] with:
- dprsite
- water
- wrapping
- eway
- material
- payment
- stock
- dairysite
- mnr
- nmr_vehicle
- contractor
- painting
- diesel
- tasks
- vehiclelog

This creates 45 routes (3 files × 15 report types) using just these simple wrappers around the generic components!
