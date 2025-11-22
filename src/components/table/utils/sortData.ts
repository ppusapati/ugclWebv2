
import { type Signal } from "@builder.io/qwik";

export function sortData({
  data,
  tableData,
  sortKey,
  sortOrder,
  totalPosts,
  prevSearch,
  searchBy
}: {
  data: { [key: string]: any }[];
  tableData: { [key: string]: any }[] | undefined;
  sortKey: Signal<string>;
  sortOrder: Signal<string>;
  totalPosts: Signal<number>;
  prevSearch: Signal<boolean>;
  searchBy: Signal<string>;
}) {
  const safeTableData = Array.isArray(tableData) ? tableData : [];

  const initialSearchKey = searchBy.value;
  if (!sortKey.value) return safeTableData;

  if (safeTableData.length === 0) {
    tableData = data;
  }

  totalPosts.value = Array.isArray(data) ? data.length : 0;

  if (prevSearch.value) {
    prevSearch.value = false;
    tableData = data;
    sortKey.value = initialSearchKey;
    sortOrder.value = 'asc';
  }

  const sortedData = (tableData ?? []).sort((a: any, b: any) => {
    return a[sortKey.value] > b[sortKey.value] ? 1 : -1;
  });

  if (sortOrder.value === 'dsc') {
    return sortedData.reverse();
  }

  return sortedData;
}
