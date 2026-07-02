export function normalizeHeader(header: string): string {
  return header.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function findHeaderIndex(
  headers: string[],
  matchers: string[],
  options?: { last?: boolean; exact?: boolean },
): number {
  const indices: number[] = [];

  for (let i = 0; i < headers.length; i++) {
    const header = normalizeHeader(headers[i] || '');
    if (!header) continue;

    const matched = matchers.some((matcher) => {
      const m = normalizeHeader(matcher);
      return options?.exact ? header === m : header.includes(m);
    });

    if (matched) indices.push(i);
  }

  if (indices.length === 0) return -1;
  return options?.last ? indices[indices.length - 1]! : indices[0]!;
}

export function getCell(row: string[], index: number): string | undefined {
  if (index < 0) return undefined;
  const value = row[index]?.toString().trim();
  return value || undefined;
}
