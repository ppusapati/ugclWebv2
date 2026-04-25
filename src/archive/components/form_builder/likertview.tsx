import { $, component$, useStore } from '@builder.io/qwik';

type LikertTableProps = {
  columnHeaders: string[];
  rowHeaders: string[];
  radioGroupPrefix: string;
  onCapture$: (data: Record<number, number>) => void;
};

export const P9ELikertView = component$((props: LikertTableProps) => {
  const { columnHeaders, rowHeaders, radioGroupPrefix} = props;

  const tableData = useStore({
    selectedValues: {} as Record<number, number>, // To store selected column index for each row
  });

  const updateRadio = $((rowIndex: number, colIndex: number) => {
    tableData.selectedValues[rowIndex] = colIndex;
  });

  return (
    <div class="overflow-x-auto">
      <table class="min-w-full text-left border-collapse border border-gray-200 shadow-md">
        <thead>
          <tr class="bg-gray-100 border-b border-gray-300 hover:text-white text-center">
            <th class="px-4 py-2"></th>
            {columnHeaders.map((header, colIndex) => (
              <th key={colIndex} class="px-4 py-2 text-gray-700 font-semibold ">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowHeaders.map((rowHeader, rowIndex) => (
            <tr key={rowIndex} class="border-b border-gray-200 text-gray-700 hover:bg-secondary-700  hover:text-white">
              <th class="px-4 py-2  font-medium ">{rowHeader}</th>
              {columnHeaders.map((_, colIndex) => (
                <td key={colIndex} class="px-4 py-2 text-center justify-center">
                  <input
                    type="radio"
                    name={`${radioGroupPrefix}-row-${rowIndex}`}  // Ensure unique name for each row with the prefix
                    value={`R${rowIndex + 1}C${colIndex + 1}`}
                    onChange$={() => updateRadio(rowIndex, colIndex)}
                    checked={tableData.selectedValues[rowIndex] === colIndex}
                    class="text-primary focus:ring-primary focus:outline-none"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
