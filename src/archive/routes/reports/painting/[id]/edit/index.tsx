import { component$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { ReportForm } from '~/components/reports/ReportForm';

export default component$(() => {
  const loc = useLocation();
  return <ReportForm reportType="painting" reportId={loc.params.id} />;
});
