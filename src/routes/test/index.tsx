import { component$ } from '@builder.io/qwik';
import { Btn, PageHeader, SectionCard } from '~/components/ds';

export default component$(() => {
  return (
    <div class="space-y-6">
      <PageHeader title="Layout Test Page" subtitle="Reference page for standardized route spacing, surfaces, and data layout" />

      <div class="grid grid-cols-12 gap-4 md:gap-6">
        <div class="col-span-12 xl:col-span-7 space-y-6">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SectionCard class="border-color-interactive-primary/20 bg-color-interactive-primary/5 p-5">
            <span class="text-lg text-primary-700 font-semibold mb-2">Total Revenue</span>
            <span class="text-3xl font-bold text-neutral-900 mb-2">₹12,45,000</span>
            <span class="text-sm text-success-600 font-medium">+15% this month</span>
            </SectionCard>
            <SectionCard class="border-color-semantic-success-200 bg-color-semantic-success-50 p-5">
            <span class="text-lg text-success-700 font-semibold mb-2">Active Users</span>
            <span class="text-3xl font-bold text-neutral-900 mb-2">8,690</span>
            <span class="text-sm text-primary-600 font-medium">+342 today</span>
            </SectionCard>
            <SectionCard class="border-color-semantic-warning-200 bg-color-semantic-warning-50 p-5">
            <span class="text-lg text-warning-700 font-semibold mb-2">Pending Orders</span>
            <span class="text-3xl font-bold text-neutral-900 mb-2">124</span>
            <span class="text-sm text-warning-700 font-medium">-3% this week</span>
            </SectionCard>
          </div>
        </div>

        <div class="col-span-12 xl:col-span-5 space-y-6">
          <SectionCard>
            <span class="mb-2 text-lg font-semibold text-neutral-800">Revenue Trend</span>
            <div class="flex h-40 w-full items-center justify-center text-muted-400">
              <span class="i-heroicons-chart-bar w-12 h-12 text-primary-300"></span>
              <span class="ml-2 font-bold text-primary-400">[Chart Placeholder]</span>
            </div>
          </SectionCard>
        </div>

        <div class="col-span-12">
          <SectionCard class="p-0 overflow-hidden">
            <div class="mb-4 flex items-center justify-between border-b border-color-border-primary px-6 py-4">
              <span class="text-xl font-bold text-neutral-900">Recent Transactions</span>
              <Btn size="sm">See all</Btn>
            </div>
            <div class="overflow-x-auto px-6 pb-6">
              <table class="min-w-full table-auto">
                <thead>
                  <tr>
                    <th class="px-3 py-2 text-left text-sm font-bold text-neutral-700">User</th>
                    <th class="px-3 py-2 text-left text-sm font-bold text-neutral-700">Order</th>
                    <th class="px-3 py-2 text-left text-sm font-bold text-neutral-700">Amount</th>
                    <th class="px-3 py-2 text-left text-sm font-bold text-neutral-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="odd:bg-white even:bg-neutral-50">
                    <td class="px-3 py-2">Praveen</td>
                    <td class="px-3 py-2">#ORD001</td>
                    <td class="px-3 py-2">₹2,500</td>
                    <td class="px-3 py-2 text-success-600">Success</td>
                  </tr>
                  <tr class="odd:bg-white even:bg-neutral-50">
                    <td class="px-3 py-2">Meena</td>
                    <td class="px-3 py-2">#ORD002</td>
                    <td class="px-3 py-2">₹5,000</td>
                    <td class="px-3 py-2 text-error-600">Failed</td>
                  </tr>
                  <tr class="odd:bg-white even:bg-neutral-50">
                    <td class="px-3 py-2">Ashok</td>
                    <td class="px-3 py-2">#ORD003</td>
                    <td class="px-3 py-2">₹1,200</td>
                    <td class="px-3 py-2 text-warning-700">Pending</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
});
