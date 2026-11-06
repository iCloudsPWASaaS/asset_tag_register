export type CsvColumn = {
  key: string;
  label: string;
};

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]) {
  const header = columns.map((column) => escapeCsv(column.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsv(row[column.key])).join(","),
  );
  return [header, ...lines].join("\r\n");
}
