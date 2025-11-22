import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return (
    <div class="grid grid-cols-12 gap-4 md:gap-6">
      {/* ===== Metric Cards ===== */}
      <div class="col-span-12 xl:col-span-7 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Metric Card 1 */}
          <div class="card bg-primary-50 shadow-md p-5 rounded-2xl flex flex-col items-start">
            <span class="text-lg text-primary-700 font-semibold mb-2">Total Revenue</span>
            <span class="text-3xl font-bold text-dark-900 mb-2">₹12,45,000</span>
            <span class="text-sm text-success-600 font-medium">+15% this month</span>
          </div>
          {/* Metric Card 2 */}
          <div class="card bg-success-50 shadow-md p-5 rounded-2xl flex flex-col items-start">
            <span class="text-lg text-success-700 font-semibold mb-2">Active Users</span>
            <span class="text-3xl font-bold text-dark-900 mb-2">8,690</span>
            <span class="text-sm text-primary-600 font-medium">+342 today</span>
          </div>
          {/* Metric Card 3 */}
          <div class="card bg-warning-50 shadow-md p-5 rounded-2xl flex flex-col items-start">
            <span class="text-lg text-warning-700 font-semibold mb-2">Pending Orders</span>
            <span class="text-3xl font-bold text-dark-900 mb-2">124</span>
            <span class="text-sm text-warning-700 font-medium">-3% this week</span>
          </div>
        </div>
        {/* You can add more grid rows or other widgets here */}
      </div>

      {/* ===== Chart/Widget Panels ===== */}
      <div class="col-span-12 xl:col-span-5 space-y-6">
        {/* Chart Widget (placeholder, you can add chart component here) */}
        <div class="card bg-white shadow-lg rounded-2xl p-6 flex flex-col items-start">
          <span class="text-lg font-semibold text-dark-800 mb-2">Revenue Trend</span>
          <div class="w-full h-40 flex items-center justify-center text-muted-400">
            {/* Replace this div with a real chart component */}
            <span class="i-heroicons-chart-bar w-12 h-12 text-primary-300"></span>
            <span class="ml-2 text-primary-400 font-bold">[Chart Placeholder]</span>
          </div>
        </div>
      </div>

      {/* ===== Table Section ===== */}
      <div class="col-span-12">
        <div class="card bg-white shadow-lg rounded-2xl p-6">
          <div class="flex justify-between items-center mb-4">
            <span class="text-xl font-bold text-dark-900">Recent Transactions</span>
            <button class="btn-primary-600 btns-sm">See all</button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full table-auto">
              <thead>
                <tr>
                  <th class="text-left text-sm font-bold text-dark-700 py-2 px-3">User</th>
                  <th class="text-left text-sm font-bold text-dark-700 py-2 px-3">Order</th>
                  <th class="text-left text-sm font-bold text-dark-700 py-2 px-3">Amount</th>
                  <th class="text-left text-sm font-bold text-dark-700 py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr class="even:bg-light-50 odd:bg-white">
                  <td class="py-2 px-3">Praveen</td>
                  <td class="py-2 px-3">#ORD001</td>
                  <td class="py-2 px-3">₹2,500</td>
                  <td class="py-2 px-3 text-success-600">Success</td>
                </tr>
                <tr class="even:bg-light-50 odd:bg-white">
                  <td class="py-2 px-3">Meena</td>
                  <td class="py-2 px-3">#ORD002</td>
                  <td class="py-2 px-3">₹5,000</td>
                  <td class="py-2 px-3 text-danger-600">Failed</td>
                </tr>
                <tr class="even:bg-light-50 odd:bg-white">
                  <td class="py-2 px-3">Ashok</td>
                  <td class="py-2 px-3">#ORD003</td>
                  <td class="py-2 px-3">₹1,200</td>
                  <td class="py-2 px-3 text-warning-700">Pending</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});
