/**
 * Full audit: live Google Sheet headers vs excelService.ts mapping.
 * Run: node scripts/audit-sheets.mjs
 */
import Papa from 'papaparse';

const SPREADSHEET_ID = '13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE';

const KNOWN_SHEETS = [
  { key: 'recruitment', name: 'Recruitment', gid: '0' },
  { key: 'resignation', name: 'Resignation', gid: '421155818' },
  { key: 'exit', name: 'Exit Interview', gid: '773827159' },
  { key: 'manpower', name: 'Manpower', gid: '286117473' },
  { key: 'jobnet', name: 'JobNet', gid: '195767405' },
];

const csvUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

async function discoverSheets() {
  const html = await fetch(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`).then((r) => r.text());
  const found = [...html.matchAll(/"sheetId":(\d+),"title":"([^"]+)"/g)].map((m) => ({
    gid: m[1],
    name: m[2],
  }));
  return found;
}

function idx(headers, ...keys) {
  return headers.findIndex((h) => {
    const hl = String(h || '').toLowerCase();
    return keys.some((k) => hl.includes(k.toLowerCase()) || String(h).includes(k));
  });
}

async function auditRecruitment(text) {
  const rows = Papa.parse(text, { header: false, skipEmptyLines: true }).data;
  const headers = rows[0].map((h) => String(h || '').replace(/\s+/g, ' ').trim());
  const issues = [];

  const expected = {
    month: ['လ', 'month'],
    name: ['cv in', 'name', 'အမည်'],
    position: ['ရာထူး', 'position'],
    department: ['ဌာန', 'dept'],
    cvDate: ['cv ရရှိ', 'cv date'],
    joinedDate: ['joined date'],
    hodSent: ['hod', 'ပေးပို့'],
    firstInterview: ['first interview', 'ပထမ'],
    secondInterview: ['second interview', 'ဒုတိယ'],
    finalStatus: ['result', 'status', 'final'],
  };

  for (const [field, keys] of Object.entries(expected)) {
    const i = idx(headers, ...keys);
    if (i < 0) issues.push({ severity: 'high', field, msg: `No column match for ${field}` });
  }

  // Code uses generic 'Result' - recruitment has multiple Result columns
  const resultCols = headers.map((h, i) => (/result/i.test(h) ? i : -1)).filter((i) => i >= 0);
  if (resultCols.length > 1) {
    issues.push({
      severity: 'medium',
      field: 'finalStatus',
      msg: `${resultCols.length} "Result" columns — code picks first only (idx ${resultCols[0]}: "${headers[resultCols[0]]}")`,
    });
  }

  const hodIdx = idx(headers, 'hod', 'ပေးပို့');
  const firstIntDateIdx = idx(headers, 'first interview date', 'first');
  const secondIntDateIdx = idx(headers, 'second interview date', 'second');

  if (firstIntDateIdx >= 0 && hodIdx >= 0) {
    issues.push({
      severity: 'medium',
      field: 'firstInterview',
      msg: `Code checks boolean HOD col (idx ${hodIdx}) not First Interview Date (idx ${firstIntDateIdx}: "${headers[firstIntDateIdx]}")`,
    });
  }

  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c || '').trim()));
  const joinedIdx = idx(headers, 'joined date');
  let joined = 0;
  if (joinedIdx >= 0) {
    for (const r of dataRows) if (String(r[joinedIdx] || '').trim()) joined++;
  }

  return { headers, rowCount: dataRows.length, joinedCount: joined, issues };
}

async function auditHeaderSheet(text, name) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields || [];
  const rows = parsed.data.filter((r) => Object.values(r).some((v) => String(v || '').trim()));
  return { headers, rowCount: rows.length };
}

async function auditManpower(text) {
  const rows = Papa.parse(text, { header: false, skipEmptyLines: true }).data;
  const headers = (rows[0] || []).map((h) => String(h || '').trim());
  const data = rows.slice(1).filter((r) => r[2] && !String(r[2]).toLowerCase().includes('total'));
  const issues = [];

  const expected = ['No', 'FP No', 'Employee Name', 'Position', 'Department', 'Section', 'Shop Location', 'Division', 'Gender'];
  expected.forEach((col, i) => {
    if (headers[i] !== col) {
      issues.push({ severity: 'high', msg: `Col ${i}: expected "${col}", got "${headers[i] || '(missing)'}"` });
    }
  });

  if (headers.length > expected.length) {
    issues.push({ severity: 'medium', msg: `${headers.length - expected.length} extra column(s): ${headers.slice(expected.length).join(', ')}` });
  }

  return { headers, rowCount: data.length, issues };
}

async function auditJobNet(text) {
  const rows = Papa.parse(text, { header: false, skipEmptyLines: true }).data;
  const headers = (rows[0] || []).map((h) => String(h || '').replace(/\s+/g, ' ').trim());
  const data = rows.slice(1).filter((r) => r[2]);
  const issues = [];

  const codeMap = {
    2: 'name (အမည်)',
    3: 'position (ရာထူး)',
    4: 'department',
    5: 'phNo',
    6: 'cvReceivedDate',
    7: 'firstInterviewDate',
    9: 'interviewScore',
    11: 'secondInterviewDate',
    13: 'မှတ်ချက်',
    14: 'offer',
    15: 'joinedDate',
    16: 'remark',
  };

  for (const [i, label] of Object.entries(codeMap)) {
    const col = headers[+i];
    if (!col) issues.push({ severity: 'high', msg: `Missing col ${i} for ${label}` });
  }

  if (headers[1]?.toLowerCase().includes('cv in') && headers[2]?.includes('အမည်')) {
    // OK — shifted layout
  } else {
    issues.push({ severity: 'high', msg: `Unexpected JobNet layout: [1]="${headers[1]}", [2]="${headers[2]}"` });
  }

  return { headers, rowCount: data.length, issues };
}

// --- main ---
console.log('=== Google Sheets Data Integrity Audit ===\n');
console.log('Spreadsheet:', SPREADSHEET_ID);

let discovered = [];
try {
  discovered = await discoverSheets();
} catch {
  /* ignore */
}

if (discovered.length) {
  console.log('\n--- All tabs in spreadsheet ---');
  const knownGids = new Set(KNOWN_SHEETS.map((s) => s.gid));
  for (const s of discovered) {
    const linked = knownGids.has(s.gid) ? '✓ linked' : '✗ NOT IN CODE';
    console.log(`  ${s.name} (gid ${s.gid}) — ${linked}`);
  }
  const unknown = discovered.filter((s) => !knownGids.has(s.gid));
  if (unknown.length) {
    console.log(`\n⚠ ${unknown.length} sheet(s) not wired in excelService.ts`);
  }
} else {
  console.log('\n(Could not auto-discover tabs — auditing known 5 sheets only)');
}

const results = {};

for (const sheet of KNOWN_SHEETS) {
  const text = await fetch(csvUrl(sheet.gid)).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });

  let audit;
  if (sheet.key === 'recruitment') audit = await auditRecruitment(text);
  else if (sheet.key === 'manpower') audit = await auditManpower(text);
  else if (sheet.key === 'jobnet') audit = await auditJobNet(text);
  else audit = await auditHeaderSheet(text, sheet.name);

  results[sheet.key] = audit;

  console.log(`\n--- ${sheet.name} (gid ${sheet.gid}) ---`);
  console.log(`Rows: ${audit.rowCount}`);
  if (audit.joinedCount != null) console.log(`Joined (sheet): ${audit.joinedCount}`);
  console.log('Headers:', JSON.stringify(audit.headers?.slice?.(0, 20) || audit.headers));
  if (audit.issues?.length) {
    console.log('Issues:');
    for (const iss of audit.issues) console.log(`  [${iss.severity}] ${iss.field || ''} ${iss.msg}`);
  } else {
    console.log('Column mapping: OK');
  }
}

console.log('\n=== CODE ISSUES (not from sheet) ===');
const codeIssues = [
  'Manpower: budgeted=0, variance=0 — no budget sheet linked',
  'Branch/Dept Scorecard: attendance = formula from turnover+vacancy (NOT from sheet)',
  'BranchScorecard: vacancy uses recruitment pipeline when budgeted=0 (proxy)',
  'JobNet fetch error → falls back to mockJobNetData (random mock)',
  'App.tsx: empty JobNet → mockJobNetData fallback',
  'Recruitment: sentToHOD/firstInterview use generic column match — may not match sheet interview stage columns',
  'Recruitment: default month "Mar" when လ empty',
  'Recruitment: default date "Today" when CV date empty',
  'TalentSuccession: successor logic computed, not from sheet',
  'RiskAlertCenter thresholds (15%, 25%) are business rules not sheet data',
];
codeIssues.forEach((c, i) => console.log(`${i + 1}. ${c}`));

console.log('\n=== SUMMARY ===');
const high = Object.values(results).flatMap((r) => r.issues || []).filter((i) => i.severity === 'high');
const med = Object.values(results).flatMap((r) => r.issues || []).filter((i) => i.severity === 'medium');
console.log(`Sheet mapping issues: ${high.length} high, ${med.length} medium`);
console.log(`Known sheets in code: ${KNOWN_SHEETS.length}`);
if (discovered.length) console.log(`Total sheets in file: ${discovered.length}`);
