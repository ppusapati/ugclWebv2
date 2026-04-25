import { component$ } from '@builder.io/qwik';
import { ReportList } from '~/components/reports/ReportList';

export default component$(() => {
  return <ReportList reportType="material" />;
});
