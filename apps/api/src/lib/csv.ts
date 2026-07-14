/**
 * RFC 4180-style field escaping: quote a field if it contains a comma,
 * quote, or newline, doubling any internal quotes.
 */
export function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvRow(fields: string[]): string {
  return fields.map(csvField).join(",");
}

export function toCsv(header: string[], rows: string[][]): string {
  return [csvRow(header), ...rows.map(csvRow)].join("\r\n");
}
