import { component$ } from '@builder.io/qwik';
import { ReportForm } from '~/components/reports/ReportForm';

export default component$(() => {
  return <ReportForm reportType="eway" />;
});
