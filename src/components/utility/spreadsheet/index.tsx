import { $, component$, useStore } from "@builder.io/qwik";

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
   <table style='border:none'>
        <tbody>
          {store.rows.map((row, rowIndex) => (
            <tr key={rowIndex} style='padding-bottom: -5px'>
              {row.map((cell, colIndex) => (
                <td key={colIndex} style='width:auto; padding-right: 8px;'>
                  <input
                    value={cell.value}
                    onInput$={(e) => handleInputChange(e, rowIndex, colIndex)}
                    style={{ padding: "8px 8px 8px 1px", border: "1px solid #ccc", width: "100%", margin: "0px 8px -4px 0px" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
     <div style={{ marginTop: "10px" }}>
     <button onClick$={addRow}>Add Row</button>
     <button onClick$={addColumn} style={{ marginLeft: "10px" }}>Add Column</button>
   </div>
   </>
  );
});
