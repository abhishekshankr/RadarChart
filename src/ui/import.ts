export function parseCSV(text: string): { name: string; value: number }[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) throw new Error('Empty input');

  // Skip header if second column of first row is non-numeric
  const firstCols = lines[0].split(',');
  const start = isNaN(Number(firstCols[1]?.trim())) ? 1 : 0;

  const rows = lines.slice(start);
  if (rows.length === 0) throw new Error('No data rows found (only a header?)');

  return rows.map((line, i) => {
    const parts = line.split(',');
    const name = parts[0]?.trim();
    const valStr = parts[1]?.trim();
    if (!name || valStr === undefined) throw new Error(`Row ${i + 1 + start}: expected "Name,Value"`);
    const value = Number(valStr);
    if (isNaN(value)) throw new Error(`Row ${i + 1 + start}: "${valStr}" is not a number`);
    return { name, value };
  });
}

export function parseJSON(text: string): { name: string; value: number }[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array at the top level');
  return parsed.map((item, i) => {
    if (typeof (item as Record<string, unknown>).name !== 'string' || typeof (item as Record<string, unknown>).value !== 'number') {
      throw new Error(`Item ${i}: must have { "name": string, "value": number }`);
    }
    return { name: (item as { name: string; value: number }).name, value: (item as { name: string; value: number }).value };
  });
}
