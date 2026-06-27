import Papa from 'papaparse';

const url = (gid) =>
  `https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=${gid}`;

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(s) {
  if (!s) return null;
  const p = s.split(/[./-]/);
  if (p.length < 3) return null;
  let p1 = +p[0], p2 = +p[1], p3 = +p[2];
  if (p3 < 100) p3 += 2000;
  if (p3 > 31) {
    if (p1 > 12) return new Date(p3, p2 - 1, p1);
    return new Date(p3, p1 - 1, p2);
  }
  if (p1 > 12) return new Date(p3, p2 - 1, p1);
  return new Date(p3, p1 - 1, p2);
}

function resolveMonth(rawMonth, fallbackDate) {
  if (rawMonth) {
    const d = parseDate(rawMonth);
    if (d && !isNaN(d)) return MONTH_ORDER[d.getMonth()];
    const token = rawMonth.trim().split(/\s+/)[0].toLowerCase();
    const map = {
      january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr', may: 'May', june: 'Jun',
      july: 'Jul', august: 'Aug', september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
    };
    if (map[token]) return map[token];
  }
  const d = parseDate(fallbackDate);
  return d && !isNaN(d) ? MONTH_ORDER[d.getMonth()] : 'Unknown';
}

function recruitmentName(row, headers, index) {
  const getVal = (keys) => {
    const idx = headers.findIndex((h) => keys.some((k) => h.toLowerCase().includes(k.toLowerCase()) || h.includes(k)));
    return idx >= 0 ? row[idx]?.toString().trim() : undefined;
  };
  const direct = getVal(['Name', 'အမည်', 'Candidate Name']);
  if (direct) return direct;
  const cvIn = headers.map((h, i) => (h.replace(/\s+/g, ' ').trim().toLowerCase() === 'cv in' ? i : -1)).filter((i) => i >= 0);
  const channel = /^(viber|job\s*net|facebook|email|walk-?in)$/i;
  for (let i = cvIn.length - 1; i >= 0; i--) {
    const val = row[cvIn[i]]?.toString().trim();
    if (val && !channel.test(val)) return val;
  }
  return `Candidate ${index + 1}`;
}

const [rec, res, exit, mp, job] = await Promise.all([
  fetch(url(0)).then((r) => r.text()),
  fetch(url(421155818)).then((r) => r.text()),
  fetch(url(773827159)).then((r) => r.text()),
  fetch(url(286117473)).then((r) => r.text()),
  fetch(url(195767405)).then((r) => r.text()),
]);

const recRows = Papa.parse(rec, { header: false, skipEmptyLines: true }).data;
const recHeaders = recRows[0].map((h) => String(h || '').trim());
const recData = recRows.slice(1).filter((r) => r.some((c) => String(c || '').trim()));
const named = recData.filter((r, i) => !recruitmentName(r, recHeaders, i).startsWith('Candidate'));

const resData = Papa.parse(res, { header: true, skipEmptyLines: true }).data.filter((r) => r['Employee Name']);
const exitData = Papa.parse(exit, { header: true, skipEmptyLines: true }).data.filter((r) => r['Employee Name']);
const mpRows = Papa.parse(mp, { header: false, skipEmptyLines: true }).data.slice(1).filter((r) => r[2] && !String(r[2]).toLowerCase().includes('total'));
const jobRows = Papa.parse(job, { header: false, skipEmptyLines: true }).data.slice(1).filter((r) => r[2]);

const resMonths = resData.map((r) => resolveMonth(r['Resigned Months'] || r.Month || '', r['Last Working Date'] || ''));
const exitMonths = exitData.map((r) => resolveMonth(r.Months || r.Month || '', r['Resignation Date'] || ''));

console.log('=== Sheet mapping verification ===');
console.log('Manpower employees:', mpRows.length);
console.log('  sample shopLocation:', mpRows[0][6], '| division:', mpRows[0][7]);
console.log('Resignations:', resData.length, '| unknown month:', resMonths.filter((m) => m === 'Unknown').length);
console.log('Exit interviews:', exitData.length, '| unknown month:', exitMonths.filter((m) => m === 'Unknown').length);
console.log('Recruitment rows:', recData.length, '| named candidates:', named.length);
console.log('  sample name:', recruitmentName(recData[0], recHeaders, 0));
console.log('JobNet rows:', jobRows.length);
console.log('  sample:', { name: jobRows[0][2], position: jobRows[0][3], dept: jobRows[0][4], ph: jobRows[0][5] });
