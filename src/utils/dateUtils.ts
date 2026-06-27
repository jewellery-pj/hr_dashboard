export const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function normalizeMonth(m: string): string {
  if (!m) return 'Unknown';
  const lower = m.toLowerCase().trim();
  const monthsMap: Record<string, string> = {
    january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr',
    may: 'May', june: 'Jun', july: 'Jul', august: 'Aug',
    september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr',
    jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep',
    oct: 'Oct', nov: 'Nov', dec: 'Dec',
  };
  return monthsMap[lower] || (MONTH_ORDER.includes(m) ? m : m);
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[./-]/);
  if (parts.length < 3) return null;
  const p1 = parseInt(parts[0], 10);
  const p2 = parseInt(parts[1], 10);
  let p3 = parseInt(parts[2], 10);
  if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return null;
  if (p3 < 100) p3 += 2000;
  if (p3 > 31) {
    if (p1 > 12) return new Date(p3, p2 - 1, p1);
    return new Date(p3, p1 - 1, p2);
  }
  if (p1 > 12) return new Date(p3, p2 - 1, p1);
  return new Date(p3, p1 - 1, p2);
}

export function extractMonthFromDate(dateStr: string): string | null {
  const d = parseDate(dateStr);
  if (!d || isNaN(d.getTime())) return null;
  return MONTH_ORDER[d.getMonth()];
}

export function sortByDate(a: string, b: string): number {
  const da = parseDate(a);
  const db = parseDate(b);
  if (da && db) return da.getTime() - db.getTime();
  return a.localeCompare(b);
}

export function isStageCompleted(val: string | undefined): boolean {
  if (!val || !val.trim()) return false;
  const lower = val.toLowerCase().trim();
  if (['no', 'n', '0', 'false', '-', 'na', 'n/a', 'pending', 'none'].includes(lower)) return false;
  if (lower === 'yes' || lower === 'y' || lower === '1' || lower.includes('yes')) return true;
  return parseDate(val) !== null;
}

export function normalizeDateForCompare(dateStr: string): string {
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const p1 = parseInt(parts[0], 10);
      const p2 = parseInt(parts[1], 10);
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      if (p1 > 12) {
        return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }
  return dateStr;
}

export function monthFromResignationDate(rawDate: string): string {
  const fromParse = extractMonthFromDate(rawDate);
  if (fromParse) return fromParse;
  return 'Unknown';
}
