import { $, component$, useStore } from "@builder.io/qwik";
import { Btn } from "~/components/ds";

type Cell = {
  value: string;
};

type SpreadsheetStore = {
  rows: Cell[][];
};

export const Spreadsheet = component$(() => {
  const store = useStore<SpreadsheetStore>({
    rows: Array.from({ length: 10 }, () =>
      Array.from({ length: 5 }, () => ({ value: "" }))
    ),
  });

  const handleInputChange = $((e: Event, rowIndex: number, colIndex: number) => {
    const input = e.target as HTMLInputElement;
    store.rows[rowIndex][colIndex].value = input.value;
  });

  const addRow = $(() => {
    store.rows.push(Array.from({ length: store.rows[0].length }, () => ({ value: "" })));
  });

  const addColumn = $(() => {
    store.rows.forEach(row => row.push({ value: "" }));
  });

  return (
    <>
   <table class='border-0'>
        <tbody>
          {store.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} class='w-auto pr-2'>
                  <input
                    value={cell.value}
                    onInput$={(e) => handleInputChange(e, rowIndex, colIndex)}
                    class='w-full border border-neutral-300 py-2 pl-1 pr-2 mb-1 mr-2'
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
     <div class='mt-2.5'>
     <Btn size="sm" variant="secondary" onClick$={addRow}>Add Row</Btn>
     <Btn size="sm" variant="secondary" onClick$={addColumn} class='ml-2.5'>Add Column</Btn>
   </div>
   </>
  );
});
