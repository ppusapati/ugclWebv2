import { $, component$, useStore } from '@builder.io/qwik';
import {P9ECard} from "~/components/utility";
type TableData = {
  columns: string[];
  rows: string[][];
  selectedValues: Record<number, number>;
}

export const P9ELikert = component$(() => {
  const tableData = useStore<TableData>({
    columns: [''],
    rows: [['']],
    selectedValues: {},
  });

  const addRow = $(() => {
    tableData.rows.push(new Array(tableData.columns.length).fill(''));
  });

  const addColumn = $(() => {
    tableData.columns.push(`Column ${tableData.columns.length + 1}`);
    tableData.rows.forEach(row => row.push(''));
  });

  const updateCell = $((rowIndex: number, colIndex: number, event: Event) => {
    const target = event.target as HTMLInputElement | null;
    if (target) {
      tableData.rows[rowIndex]![colIndex] = target.value;
    }
  });

  const removeRow = $((rowIndex: number) => {
    if (tableData.rows.length > 1) {
      tableData.rows.splice(rowIndex, 1);
    }
  });

  const removeColumn = $((colIndex: number) => {
    if (tableData.columns.length > 1) {
      tableData.columns.splice(colIndex, 1);
      tableData.rows.forEach(row => row.splice(colIndex, 1));
    }
  });

  const captureJson = $(() => {
    const columns = tableData.rows[0]!.slice(1);
    const rows = tableData.rows.slice(1).map(row => row[0]);

    const jsonData = JSON.stringify({ columns, rows });
    console.log(jsonData);
    alert(`Captured JSON: ${jsonData}`);
  });

  return (
    <div>
  <P9ECard title='Define Likert' footer=''>
      <table>
        <thead>
          <tr>
            <th></th>
            {tableData.columns.map((column, colIndex) => (
              <th key={colIndex}>
                {column}
                {colIndex > 0 && (
                  <button onClick$={() => removeColumn(colIndex)}>Remove Column</button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                {rowIndex > 0 && (
                  <button onClick$={() => removeRow(rowIndex)}>Remove Row</button>
                )}
              </td>
              {row.map((cell, colIndex) => (
                <td key={colIndex}>
                  <input
                    type={rowIndex === 0 || colIndex === 0 ? 'text' : 'radio'}
                    name={rowIndex > 0 && colIndex > 0 ? `row-${rowIndex}` : undefined}
                    value={rowIndex === 0 || colIndex === 0 ? cell : colIndex.toString()}
                    onChange$={rowIndex === 0 || colIndex === 0 ? $((event) => updateCell(rowIndex, colIndex, event)) : undefined}
                    disabled={rowIndex === 0 || colIndex === 0 ? false: true}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick$={addRow}>Add Row</button>
      <button onClick$={addColumn}>Add Column</button>
      <button onClick$={captureJson}>Capture JSON</button>
      </P9ECard>
    </div>
  );
});