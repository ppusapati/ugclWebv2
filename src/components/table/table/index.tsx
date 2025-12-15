import {
  component$,
  useStylesScoped$,
  useSignal,
  useStore,
  $,
  useResource$,
  useTask$,
  useStyles$,
  QRL,
  useVisibleTask$
} from '@builder.io/qwik';
import { Pagination } from './Pagination';
import { sortData } from '../utils/sortData';
import { searchData } from '../utils/searchedData';
import { TableHead } from './TableHead';
import { TableBody, type ActionButton, type ActionLink, type ActionItem, type ActionItems } from './Body';
import { Search } from './Search';

// Re-export action types for consumer use
export type { ActionButton, ActionLink, ActionItem, ActionItems };

interface TableProps<T = any> {
  header: {
    key: keyof T & string;
    label: string;
    type?: string;
    format?: string;
  }[];
  data: T[];
  title: string;
  headerImg?: string;
  defaultLimit?: number;
  serverPagination?: boolean;
  totalCount?: number;
  selectedForm?: string;
  onPageChange$?: QRL<(page: number, limit: number) => Promise<T[]>>;
  onExportData$?: QRL<() => Promise<T[]>>; // New prop for fetching all data
  enableSearch?: boolean;
  enableSort?: boolean;
}

// Utility function to format dates for display
const formatDateForDisplay = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // Check if it's already in a readable format
    if (typeof dateValue === 'string' && !dateValue.includes('T')) {
      return dateValue;
    }
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue.toString();
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.log(error);
    return dateValue.toString();
  }
};

// Utility function to check if a value looks like a date for display
const isDateFieldForDisplay = (key: string, value: any): boolean => {
  if (!value) return false;
  
  // Check if field name suggests it's a date
  const dateKeywords = ['date', 'time', 'created', 'updated', 'modified'];
  const isDateKey = dateKeywords.some(keyword => 
    key.toLowerCase().includes(keyword)
  );
  
  // Check if value looks like an ISO date string
  const isISOString = typeof value === 'string' && 
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  
  return isDateKey && isISOString;
};

export const pickPdfFormat = (numColumns: number) => {
  if (numColumns <= 4) return 'a5';
  if (numColumns <= 8) return 'a4';
  if (numColumns <= 14) return 'a3';
  if (numColumns <= 20) return 'a2';
  return 'a1';
};

// Utility function to format dates
const formatDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // Check if it's already in a readable format
    if (typeof dateValue === 'string' && !dateValue.includes('T')) {
      return dateValue;
    }
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue.toString();
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.log(error);
    return dateValue.toString();
  }
};

// Utility function to check if a value looks like a date
const isDateField = (key: string, value: any): boolean => {
  if (!value) return false;
  
  // Check if field name suggests it's a date
  const dateKeywords = ['date', 'time', 'created', 'updated', 'modified'];
  const isDateKey = dateKeywords.some(keyword => 
    key.toLowerCase().includes(keyword)
  );
  
  // Check if value looks like an ISO date string
  const isISOString = typeof value === 'string' && 
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  
  return isDateKey && isISOString;
};

export const P9ETable = component$(
  <T extends { [key: string]: string | number | null | undefined | ActionItems }>(
    props: TableProps<T>
  ) => {
    const onPageChangeQrl = props.onPageChange$;
    const onExportDataQrl = props.onExportData$;
    
    useStyles$(`
      .professional-table {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .table-container {
        // background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 2px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }
      
      .table-inner {
        background: white;
        border-radius: 14px;
        overflow: hidden;
      }
      
      .table-header {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid #e2e8f0;
      }
      
      .export-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .export-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .export-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .export-btn:active {
        transform: translateY(0);
      }
      
      .export-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .csv-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      
      .excel-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      
      .pdf-btn {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      
      .stats-container {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(99, 102, 241, 0.1);
        color: #4f46e5;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .data-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: white;
      }
      
      .data-table th {
        // background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        padding: 16px 20px;
        text-align: left;
        font-weight: 600;
        font-size: 13px;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      .data-table th:first-child {
        border-top-left-radius: 0;
      }
      
      .data-table th:last-child {
        border-top-right-radius: 0;
      }
      
      .data-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
        color: #374151;
        vertical-align: middle;
      }
      
      .data-table tbody tr {
        transition: all 0.2s ease;
      }
      
      .data-table tbody tr:hover {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        transform: scale(1.001);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      
      .data-table tbody tr:nth-child(even) {
        background: #fafbfc;
      }
      
      .data-table tbody tr:nth-child(even):hover {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }
      
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background: white;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        background: white;
        color: #6b7280;
      }
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .footer-stats {
        padding: 16px 20px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        color: #6b7280;
      }
      
      .scroll-indicator {
        position: sticky;
        right: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 30%);
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 18px;
      }

      .export-loading {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      
      .export-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `);

    useStylesScoped$(AppCSS);

    const defaultKey = Array.isArray(props.header) && props.header.length > 0
      ? String(props.header[0].key)
      : '';

    const sortOrder = useSignal('asc');
    const sortKey = useSignal(defaultKey);
    const pageNo = useSignal(0);
    const postPerPage = useSignal(props.defaultLimit ?? 100);
    const totalPosts = useSignal(props.data?.length ?? 0);
    const searchBy = useSignal(defaultKey);
    const searchInp = useSignal('');
    const prevSearch = useSignal(false);
    const loading = useSignal(false);
    const totalCountSignal = useSignal(props.totalCount ?? 0);
    const exportLoading = useSignal(false);

    const serverPagination = props.serverPagination;
    const enableSearch = props.enableSearch;
    const enableSort = props.enableSort;
    const totalCount = props.totalCount;
    const data = props.data;
    
    const finalData = useStore<{ items: T[] }>({
      items: Array.isArray(props.data) ? props.data : []
    });

    const sortedData = $(() =>
      sortData({
        data: data,
        tableData: finalData.items,
        sortKey,
        sortOrder,
        totalPosts,
        prevSearch,
        searchBy
      })
    );

    const searchedData = $(() =>
      searchData({
        data: data,
        pageNo,
        sortKey,
        sortOrder,
        totalPosts,
        searchBy,
        searchInp,
        prevSearch
      })
    );

    useVisibleTask$(() => { pageNo.value = 0; });

    const serverDataResource = useResource$(async ({ track }) => {
      if (!serverPagination || !onPageChangeQrl) return null;

      const currentPage = track(() => pageNo.value);
      const currentLimit = track(() => postPerPage.value);
      track(() => props.selectedForm);
      
      try {
        const result = await onPageChangeQrl(currentPage, currentLimit);
        return result;
      } catch (error) {
        console.error('Error fetching page data:', error);
        throw error;
      }
    });

    useTask$(async ({ track }) => {
      if (!serverPagination) return;

      const rowsPromise = track(() => serverDataResource.value);
      if (!rowsPromise) return;

      const rows = await rowsPromise;

      if (Array.isArray(rows)) {
        // Format dates for display in server pagination data
        finalData.items = rows.map((row) => {
          const formattedRow = { ...row };
          Object.keys(formattedRow).forEach((key) => {
            const value = formattedRow[key as keyof T];
            if (isDateFieldForDisplay(key, value)) {
              (formattedRow as any)[key] = formatDateForDisplay(value);
            }
          });
          return formattedRow;
        });
        totalCountSignal.value = totalCount ?? rows.length;
      }
    });

    const isLoading = serverPagination ? serverDataResource.loading : loading.value;

    useTask$(async ({ track }) => {
      if (serverPagination) return;

      track(() => data);
      track(() => sortKey.value);
      track(() => sortOrder.value);
      track(() => searchInp.value);
      track(() => searchBy.value);
      track(() => pageNo.value);
      track(() => postPerPage.value);

      loading.value = true;

      try {
        let processedData: T[];
        
        if (enableSearch && searchInp.value !== '') {
          processedData = await searchedData();
        } else if (enableSort) {
          processedData = (await sortedData()) as T[];
        } else {
          processedData = data;
        }

        // Format dates for display in the table
        finalData.items = processedData.map((row) => {
          const formattedRow = { ...row };
          Object.keys(formattedRow).forEach((key) => {
            const value = formattedRow[key as keyof T];
            if (isDateFieldForDisplay(key, value)) {
              (formattedRow as any)[key] = formatDateForDisplay(value);
            }
          });
          return formattedRow;
        });

        totalPosts.value = finalData.items?.length ?? 0;
      } catch (error) {
        console.error('Error processing data:', error);
      } finally {
        loading.value = false;
      }
    });

    const isEmpty = () =>
      !finalData.items || !Array.isArray(finalData.items) || finalData.items.length === 0;

    // Function to get all data for export
    const getAllDataForExport = $(async (): Promise<T[]> => {
      if (onExportDataQrl) {
        // Use the export callback to get all data
        return await onExportDataQrl();
      } else {
        // Fallback to current data if no export callback provided
        return finalData.items;
      }
    });

    // Process data for export with proper formatting
    const processDataForExport = $(
      (data: T[], headers: { key: string; label: string }[]) => {
        return data.map((row) => {
          const processedRow: Record<string, any> = {};
          
          // Process in the order of headers to maintain column order
          headers.forEach((header) => {
            let value = row[header.key as keyof T];
            
            // Format dates
            if (isDateField(header.key, value)) {
              value = formatDate(value) as any;
            }
            
            // Handle arrays
            if (Array.isArray(value)) {
              processedRow[header.label] = value.join(';');
            } else {
              processedRow[header.label] = value ?? '';
            }
          });
          
          return processedRow;
        });
      }
    );

    const downloadCSV = $(async (headers: { key: string; label: string }[]) => {
      if (!headers.length) {
        alert('No columns selected for export');
        return;
      }

      exportLoading.value = true;
      try {
        const allData = await getAllDataForExport();
        
        if (!allData.length) {
          alert('No data to export');
          return;
        }

        const processedData = await processDataForExport(allData, headers);
        
        const csvHeader = headers.map((h) => `"${h.label}"`).join(',');
        const csvRows = processedData.map((row) =>
          headers
            .map((h) => {
              const val = row[h.label];
              return `"${val.toString().replace(/"/g, '""')}"`;
            })
            .join(',')
        );

        const csvContent = [csvHeader, ...csvRows].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${Date.now()}_table_export_all_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting data. Please try again.');
      } finally {
        exportLoading.value = false;
      }
    });

    const downloadExcel = $(async (headers: { key: string; label: string }[]) => {
      if (!headers.length) {
        alert('No columns selected for export');
        return;
      }

      exportLoading.value = true;
      try {
        const allData = await getAllDataForExport();

        if (!allData.length) {
          alert('No data to export');
          return;
        }

        const processedData = await processDataForExport(allData, headers);

        // Dynamic import of xlsx
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(processedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `${Date.now()}_table_export_all_data.xlsx`);
      } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting data. Please try again.');
      } finally {
        exportLoading.value = false;
      }
    });

    const downloadPDF = $(async (headers: { key: string; label: string }[]) => {
      if (!headers.length) {
        alert('No columns selected for export');
        return;
      }

      exportLoading.value = true;
      try {
        const allData = await getAllDataForExport();

        if (!allData.length) {
          alert('No data to export');
          return;
        }

        const processedData = await processDataForExport(allData, headers);

        // Dynamic imports for PDF libraries
        const { jsPDF } = await import('jspdf');
        const autoTableModule = await import('jspdf-autotable');
        const autoTable = autoTableModule.default;

        const format = pickPdfFormat(headers.length);
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'pt',
          format: format === undefined ? 'a4' : format,
          putOnlyUsedFonts: true,
          floatPrecision: 16
        });

        const tableHeaders = headers.map(h => h.label);
        const tableRows = processedData.map(row =>
          headers.map(h => {
            const val = row[h.label];
            if (val == null) return '';
            return String(val).replace(/[\r\n]+/g, ' ').trim();
          })
        );

        const columnStyles: { [key: number]: { cellWidth: number } } = {};
        for (let i = 0; i < tableHeaders.length; i++) {
          columnStyles[i] = { cellWidth: 100 };
        }

        autoTable(doc, {
          head: [tableHeaders],
          body: tableRows,
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'ellipsize',
            halign: 'left',
            valign: 'middle',
          },
          headStyles: {
            fillColor: [22, 160, 133],
            textColor: 255,
          },
          theme: 'striped',
          margin: { top: 20 },
          didDrawPage: (data) => {
            doc.setFontSize(10);
            doc.text('Exported Table Report (All Data)', data.settings.margin.left, 10);
          }
        });

        doc.save(`${Date.now()}_table_export_all_data.pdf`);
      } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting data. Please try again.');
      } finally {
        exportLoading.value = false;
      }
    });

    const colWidths = useStore<Record<string, string>>({});
    const onResizeStart$ = $((e: MouseEvent, key: string) => {
      const startX = e.clientX;
      const target = e.target as HTMLElement;
      const startWidth = target.parentElement?.offsetWidth || 0;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const newWidth = startWidth + (moveEvent.clientX - startX);
        colWidths[key] = `${newWidth}px`;
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    return (
      <div class="professional-table">
        <div class="table-container drop-shadow">
          <div class="table-inner">
            {/* Header Section */}
            <div class="table-header">
              <div class="flex justify-between items-center p-6">
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span class="text-white font-bold text-sm">📊</span>
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-gray-800">{props.title}</h2>
                      <div class="stats-container mt-1">
                        <span class="stat-badge">
                          📄 {serverPagination ? totalCountSignal.value : totalPosts.value} records
                        </span>
                        <span class="stat-badge">
                          📋 {props.header?.length || 0} columns
                        </span>
                        <span class="stat-badge">
                          📑 Page {pageNo.value + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                {props.header?.length > 0 && (
                  <div class="export-buttons">
                    <button
                      onClick$={() =>
                        downloadCSV(
                          props.header.map((h) => ({ key: String(h.key), label: h.label }))
                        )
                      }
                      disabled={exportLoading.value}
                      class="export-btn csv-btn"
                    >
                      {exportLoading.value ? (
                        <div class="export-loading">
                          <div class="export-spinner"></div>
                          Exporting...
                        </div>
                      ) : (
                        <>📊 CSV (All)</>
                      )}
                    </button>
                    <button
                      onClick$={() =>
                        downloadExcel(
                          props.header.map((h) => ({ key: String(h.key), label: h.label }))
                        )
                      }
                      disabled={exportLoading.value}
                      class="export-btn excel-btn"
                    >
                      {exportLoading.value ? (
                        <div class="export-loading">
                          <div class="export-spinner"></div>
                          Exporting...
                        </div>
                      ) : (
                        <>📈 Excel (All)</>
                      )}
                    </button>
                    <button
                      onClick$={() =>
                        downloadPDF(
                          props.header.map((h) => ({ key: String(h.key), label: h.label }))
                        )
                      }
                      disabled={exportLoading.value}
                      class="export-btn pdf-btn"
                    >
                      {exportLoading.value ? (
                        <div class="export-loading">
                          <div class="export-spinner"></div>
                          Exporting...
                        </div>
                      ) : (
                        <>📄 PDF (All)</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Top Pagination */}
            <div class="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <Search headers={props.header} searchBy={searchBy} searchInp={searchInp} />
              <Pagination
                pageNo={pageNo}
                postPerPage={postPerPage}
                totalPosts={serverPagination ? totalCountSignal : totalPosts}
              />
            </div>

            {/* Table Content */}
            <div class="overflow-x-auto">
              {isLoading ? (
                <div class="loading-container">
                  <div class="loading-spinner"></div>
                  <div class="text-gray-600 font-medium">Loading data...</div>
                  <div class="text-gray-400 text-sm mt-1">Please wait while we fetch your records</div>
                </div>
              ) : isEmpty() ? (
                <div class="empty-state">
                  <div class="empty-icon">📊</div>
                  <div class="text-lg font-semibold text-gray-700 mb-2">No Data Available</div>
                  <div class="text-gray-500">No records match your current filters</div>
                </div>
              ) : (
                <table class="data-table">
                  <TableHead
                    header={props.header.map((h) => ({
                      key: String(h.key),
                      label: h.label
                    }))}
                    sortOrder={sortOrder}
                    sortKey={sortKey}
                    colWidths={colWidths}
                    onResizeStart$={onResizeStart$}
                  />
                  <TableBody
                    data={finalData.items}
                    pageNo={pageNo}
                    postPerPage={postPerPage}
                    header={props.header.map((h) => ({
                      key: String(h.key),
                      label: h.label,
                      type: h.type,
                      format: h.format
                    }))}
                    serverPagination={serverPagination}
                  />
                </table>
              )}
            </div>

            {/* Footer */}
            {!isEmpty() && !isLoading && (
              <div class="footer-stats">
                <div class="flex items-center gap-4">
                  <span>Showing {finalData.items.length} of {serverPagination ? totalCountSignal.value : totalPosts.value} entries</span>
                  {exportLoading.value && (
                    <span class="text-blue-600 text-sm">Exporting all data...</span>
                  )}
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Data loaded successfully</span>
                </div>
              </div>
            )}

            {/* Bottom Pagination */}
            {!isEmpty() && !isLoading && (
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  pageNo={pageNo}
                  postPerPage={postPerPage}
                  totalPosts={serverPagination ? totalCountSignal : totalPosts}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export const AppCSS = `
  .table-cont {
    width: 100%;
  }
`;