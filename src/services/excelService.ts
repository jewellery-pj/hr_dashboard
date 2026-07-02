import Papa from 'papaparse';
import {
  Candidate,
  Resignation,
  ExitInterview,
  Manpower,
  JobNetData,
  EmployeeRecord,
  VacantListRow,
  VacantPositionReadinessRow,
  AttendanceRecord,
  SuccessionReadinessLink,
} from '../data/mockData';
import { isStageCompleted, monthFromResignationDate, normalizeMonth, extractMonthFromDate, MONTH_ORDER } from '../utils/dateUtils';
import { findHeaderIndex, getCell } from '../utils/sheetHeaders';

function resolveMonth(rawMonth: string, fallbackDate: string): string {
  if (rawMonth) {
    const fromDate = extractMonthFromDate(rawMonth);
    if (fromDate) return fromDate;
    const token = rawMonth.trim().split(/\s+/)[0];
    const normalized = normalizeMonth(token);
    if (MONTH_ORDER.includes(normalized)) return normalized;
  }
  return monthFromResignationDate(fallbackDate);
}

function recruitmentCandidateName(
  row: string[],
  headers: string[],
  getVal: (possibleHeaders: string[]) => string | undefined,
  index: number,
): string {
  const direct = getVal(['Name', 'အမည်', 'Candidate Name']);
  if (direct) return direct;

  const cvInIndices = headers
    .map((h, i) => (h.replace(/\s+/g, ' ').trim().toLowerCase() === 'cv in' ? i : -1))
    .filter((i) => i >= 0);

  const channelPattern = /^(viber|job\s*net|facebook|email|walk-?in|linkedin|referral)$/i;
  for (let i = cvInIndices.length - 1; i >= 0; i--) {
    const val = row[cvInIndices[i]]?.toString().trim();
    if (val && !channelPattern.test(val)) return val;
  }
  return `Candidate ${index + 1}`;
}

const RECRUITMENT_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=0';
const RESIGNATION_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=421155818';
const EXIT_INTERVIEW_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=773827159';
const MANPOWER_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=286117473';
const JOBNET_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=195767405';
const VACANT_LIST_CSV_URL = '/api/sheet-csv?sheet=Vacant%20List';
const VACANT_READINESS_CSV_URL = '/api/sheet-csv?sheet=Vacant%20Position%20Readiness%20(%)';
const ATTENDANCE_CSV_URL = '/api/sheet-csv?sheet=Attendance';

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const parseReadinessPercent = (val: any): number | undefined => {
  if (val === null || val === undefined) return undefined;
  const cleaned = val.toString().replace(/[^0-9.-]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const fetchExcelData = (): Promise<Candidate[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(RECRUITMENT_CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length === 0) {
          resolve([]);
          return;
        }

        // Find header row (the one that contains 'position' or 'ရာထူး')
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
          const row = rows[i];
          if (row && row.some(cell => {
            const c = cell?.toString().toLowerCase() || '';
            return c.includes('position') || c.includes('ရာထူး') || c.includes('designation') || c.includes('dept') || c.includes('ဌာန');
          })) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          headerIdx = 0;
        }

        const headers = rows[headerIdx].map(h => h?.toString().trim() || '');
        const dataRows = rows.slice(headerIdx + 1);

        const candidates: Candidate[] = dataRows
          .filter(row => row.some(cell => cell?.toString().trim() !== ''))
          .map((row, index) => {
            const getVal = (possibleHeaders: string[]) => {
              const idx = headers.findIndex(h => 
                possibleHeaders.some(ph => h.toLowerCase().includes(ph.toLowerCase()) || h.includes(ph))
              );
              return idx !== -1 ? row[idx]?.toString().trim() : undefined;
            };

            const name = recruitmentCandidateName(row, headers, getVal, index);
            const position = getVal(['Position', 'ရာထူး', 'Designation', 'Job Title']) || 'Unknown';
            const department = getVal(['Department', 'ဌာန', 'Dept', 'Division']) || 'Unknown';
            const rawMonth = getVal(['Month', 'လ', 'Month of CV']);
            const month = rawMonth ? normalizeMonth(rawMonth) : 'Unknown';
            const date = getVal(['CV ရရှိသည့် ရက်', 'Date', 'CV Received Date', 'CV Date']) || '';
            const joinedDate = getVal(['Joined Date', 'Join Date', 'New Join Date', 'ဝင်ရောက်သည့်ရက်']);

            const hodSentIdx = findHeaderIndex(headers, ['hod ထံ ဘယ်နေ့', 'sent to hod', 'hod sent']);
            const firstIntIdx = findHeaderIndex(headers, ['first interview date']);
            const secondIntIdx = findHeaderIndex(headers, ['second interview date']);
            const finalResultIdx = findHeaderIndex(headers, ['result'], { last: true });
            const acceptIdx = findHeaderIndex(headers, ['employee accept', 'candidate accept']);

            const sentToHOD = isStageCompleted(getCell(row, hodSentIdx));
            const firstInterview = isStageCompleted(getCell(row, firstIntIdx));
            const secondInterview = isStageCompleted(getCell(row, secondIntIdx));

            const finalStatusVal = [
              getCell(row, finalResultIdx),
              getCell(row, acceptIdx),
              getVal(['Final Status', 'နောက်ဆုံးအခြေအနေ', 'Status']),
            ].filter(Boolean).join(' ') || 'In Progress';
            let finalStatus: Candidate['finalStatus'] = 'In Progress';
            if (finalStatusVal.toLowerCase().includes('join') || !!joinedDate) finalStatus = 'Joined';
            else if (finalStatusVal.toLowerCase().includes('reject') || finalStatusVal.toLowerCase().includes('fail')) finalStatus = 'Rejected';

            return {
              id: `excel-${index + 1}`,
              name,
              position,
              department,
              month,
              date,
              joinedDate,
              cvStatus: 'Received',
              sentToHOD,
              firstInterview,
              secondInterview,
              finalStatus,
            };
          });

        resolve(candidates.filter(c => c.position !== 'Unknown' || c.department !== 'Unknown'));
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const fetchResignationData = (): Promise<Resignation[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(RESIGNATION_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        
        const resignations: Resignation[] = data
          .filter(row => row['Employee Name'] || row.Name || row['အမည်'] || row.Department || row['ဌာန'])
          .map((row, index) => {
            const rawDate = row['Last Working D'] || row['Last Working Date'] || row['Resignation Date'] || row['ထွက်သည့်ရက်'] || row['Date'] || '';
            const rawMonth = row['Resigned Months'] || row.Month || row['လ'] || '';
            const month = resolveMonth(rawMonth, rawDate);

            return {
              id: `res-${index + 1}`,
              employeeCode: row['Employee Code'] || row['ဝန်ထမ်းကုဒ်'],
              name: row['Employee Name'] || row.Name || row['အမည်'] || `Employee ${index + 1}`,
              gender: row['Gender'] || row['ကျား/မ'],
              department: row['Department'] || row['ဌာန'] || row.Dept || 'Unknown',
              designation: row['Designation'] || row.Position || row['ရာထူး'],
              division: row['Division'] || row['တိုင်း'],
              location: row['Location'] || row['နေရာ'],
              doe: row['DOE'] || row['ဝင်သည့်ရက်'],
              serviceMonth: row['Service Month'] || row['လုပ်သက်'],
              resignationDate: rawDate || 'Unknown',
              resignStatus: row['Resign Status'] || row['အခြေအနေ'],
              comment: row['Comment'] || row['မှတ်ချက်'],
              remarks: row['Remark'] || row['Remarks'] || row['အကြောင်းပြချက်'],
              month: month,
              // Compatibility
              position: row['Designation'] || row.Position || row['ရာထူး'] || 'Unknown',
              reason: row['Comment'] || row['Reason'] || row['အကြောင်းပြချက်'] || row['ထွက်ရသည့်အကြောင်းရင်း'] || 'Unknown',
            };
          });
        
        resolve(resignations);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const fetchExitInterviewData = (): Promise<ExitInterview[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(EXIT_INTERVIEW_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        
        const exitInterviews: ExitInterview[] = data
          .filter(row => row.Name || row['Employee Name'] || row['အမည်'])
          .map((row, index) => {
            const rawDate = row['Resignation Date'] || row['Date'] || row['ထွက်သည့်ရက်'] || '';
            const rawMonth = row.Months || row.Month || row['လ'] || '';
            const month = resolveMonth(rawMonth, rawDate);

            return {
              id: `exit-${index + 1}`,
              name: row['Employee Name'] || row.Name || row['အမည်'] || `Employee ${index + 1}`,
              department: row.Department || row['ဌာန'] || 'Unknown',
              position: row.Position || row.Designation || row['ရာထူး'] || 'Unknown',
              resignationDate: rawDate,
              lastDate: row['Last Date'] || row['ထွက်သည့်ရက်'] || rawDate,
              reason: row['Reason for Leaving'] || row.Reason || row['ထွက်ရသည့်အကြောင်းရင်း'] || 'Unknown',
              requestReason: row['Request Reason'] || row['Request Reaso'] || row['အကြောင်းပြချက်'] || 'Unknown',
              requestReasonCategory: row['Request Reason - Category'] || '',
              hrReason: row['HR Reason'] || row['HR မှ မှတ်ချက်'] || 'Unknown',
              hodReason: row['HODs Reason'] || row['HOD Reason'] || '',
              exitInterviewDate: row['Exit Interview Date'] || '',
              feedback: row.Feedback || row.Comments || row['အကြံပြုချက်'] || '',
              month: month,
            };
          });
        
        resolve(exitInterviews);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const fetchManpowerData = (): Promise<Manpower[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(MANPOWER_CSV_URL, {
      download: true,
      header: false, // Use index-based access for reliability with "role 5" and "role 7"
      complete: (results) => {
        const data = results.data as any[];
        if (data.length < 2) {
          resolve([]);
          return;
        }

        // Skip header row
        const rows = data.slice(1);

        // A(0): No, B(1): FP No, C(2): Employee Name, D(3): Position, E(4): Department,
        // F(5): Section, G(6): Shop Location, H(7): Division, I(8): Gender

        const aggregated = rows.reduce((acc, row) => {
          const dept = row[4] || 'Unknown';
          const pos = row[3] || 'Unknown';
          const shopLocation = row[6] || 'Unknown';
          const branch = row[7] || 'Unknown';
          const gender = row[8] || 'Unknown';

          if (dept === 'Unknown' && pos === 'Unknown') return acc;

          const key = `${dept}|${pos}|${shopLocation}|${gender}`;
          if (!acc[key]) {
            acc[key] = {
              department: dept,
              position: pos,
              shopLocation,
              branch,
              gender: gender,
              month: 'All',
              actual: 0
            };
          }
          acc[key].actual++;
          return acc;
        }, {} as Record<string, any>);

        const manpower: Manpower[] = (Object.values(aggregated) as any[]).map((item, index) => ({
          id: `mp-${index + 1}`,
          department: item.department,
          position: item.position,
          budgeted: 0, // Budget not available in employee list
          actual: item.actual,
          variance: 0,
          month: item.month,
          shopLocation: item.shopLocation,
          branch: item.branch,
          gender: item.gender,
        }));

        resolve(manpower);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const fetchJobNetData = (): Promise<JobNetData[]> => {
  return new Promise((resolve, reject) => {
    console.log('Fetching JobNet data from Google Sheet:', JOBNET_CSV_URL);
    Papa.parse(JOBNET_CSV_URL, {
      download: true,
      header: false,
      complete: (results) => {
        const data = results.data as any[];
        console.log('Google Sheet raw data rows:', data.length);
        if (data.length < 2) {
          console.log('Not enough data rows, returning empty');
          resolve([]);
          return;
        }

        // Skip header row
        const rows = data.slice(1);
        console.log('Data rows after skipping header:', rows.length);
        console.log('First 3 data rows:', rows.slice(0, 3));

        // A(0): စဉ်, B(1): CV In, C(2): အမည်, D(3): ရာထူး, E(4): Department,
        // F(5): Ph No, G(6): CV အဝင်ရက်စွဲ, H(7): First Interview, I(8): Time,
        // J(9): Score, K(10): Salary, L(11): Second Interview, M(12): Time,
        // N(13): မှတ်ချက်, O(14): Offer, P(15): Joined Date, Q(16): Remark

        const jobNetData: JobNetData[] = rows
          .filter(row => row[2] && row[2].toString().trim() !== '')
          .map((row, index) => ({
            id: `jobnet-${index + 1}`,
            name: row[2] || 'Unknown',
            position: row[3] || 'Unknown',
            phNo: row[5] || '',
            department: row[4] || 'Unknown',
            cvReceivedDate: row[6] || '',
            firstInterviewDate: row[7] || '',
            time: row[8] || '',
            interviewScore: parseNumber(row[9]),
            secondInterviewDate: row[11] || '',
            remark: row[17] || '',
            joinedDate: row[16] || '',
            offer: row[15] || '',
            မှတ်ချက်: row[14] || '',
          }));

        console.log(`Fetched ${jobNetData.length} records from Google Sheet`);
        console.log('Sample record:', jobNetData[0]);
        resolve(jobNetData);
      },
      error: (error) => {
        console.warn('Failed to fetch JobNet data from Google Sheets:', error);
        resolve([]);
      }
    });
  });
};

export const fetchEmployeeData = (): Promise<EmployeeRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(MANPOWER_CSV_URL, {
      download: true,
      header: false,
      complete: (results) => {
        const data = results.data as any[];
        if (data.length < 2) {
          resolve([]);
          return;
        }

        const rows = data.slice(1);
        const employees: EmployeeRecord[] = [];

        for (const row of rows) {
          if (!row || row.length < 5) continue;
          const name = (row[2] || '').toString().trim();
          const position = (row[3] || '').toString().trim();
          const department = (row[4] || '').toString().trim();
          const shopLocation = (row[6] || '').toString().trim() || undefined;
          const branch = (row[7] || '').toString().trim() || undefined;

          if (!name || !position || !department) continue;
          if (name.toLowerCase() === 'total' || name.toLowerCase().includes('grand total')) continue;

          employees.push({
            id: `EMP-${employees.length + 1}`,
            name,
            position,
            department,
            branch,
            shopLocation,
          });
        }

        resolve(employees);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const fetchVacantListData = (): Promise<VacantListRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(VACANT_LIST_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as any[])
          .filter(row => row['Department / Section'] || row['Sanctioned Strength'] || row['Active Headcount'])
          .map((row, index) => {
            const department = (row['Department / Section'] || '').toString().trim();
            const sanctionedStrength = parseNumber(row['Sanctioned Strength']);
            const activeHeadcount = parseNumber(row['Active Headcount']);
            const shortageRaw = parseNumber(row['Surplus /\n Shortage'] ?? row['Surplus / Shortage']);
            const shortage = shortageRaw < 0 ? Math.abs(shortageRaw) : 0;
            return {
              id: `vacant-list-${index + 1}`,
              department,
              sanctionedStrength,
              activeHeadcount,
              shortage,
              remarks: row.Remarks || '',
            };
          })
          .filter(row => row.department);

        resolve(rows);
      },
      error: (error) => reject(error),
    });
  });
};

export const fetchVacantPositionReadinessData = (): Promise<VacantPositionReadinessRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(VACANT_READINESS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = (results.meta.fields || []).map(h => (h || '').toString().trim());
        const readinessHeader = headers.find(h => /readiness|%|percent/i.test(h));
        const rows = (results.data as any[])
          .map((row, index) => {
            const department = (row.Department || row['Department / Section'] || '').toString().trim();
            const position = (row.Position || row['Vacant Position'] || '').toString().trim();
            const employeeName = (row['Employee Name'] || row.Name || '').toString().trim();
            const readinessPercent = readinessHeader ? parseReadinessPercent(row[readinessHeader]) : undefined;
            const isVacantByName = !employeeName || /vacant|vancant|open/i.test(employeeName);
            const isVacantByPosition = /vacant|vancant|open/i.test(position);

            return {
              id: `vacant-ready-${index + 1}`,
              employeeName,
              department,
              position,
              readinessPercent,
              isVacant: isVacantByName || isVacantByPosition,
            };
          })
          .filter(row => row.department && row.position);

        resolve(rows);
      },
      error: (error) => reject(error),
    });
  });
};

export const fetchSuccessionReadinessLinks = (): Promise<SuccessionReadinessLink[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(VACANT_READINESS_CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length < 3) {
          resolve([]);
          return;
        }

        const links: SuccessionReadinessLink[] = [];
        let currentDepartment = '';
        for (const row of rows.slice(2)) {
          const department = (row[1] || '').toString().trim();
          if (department) currentDepartment = department;
          if (!currentDepartment) continue;

          const successorName = (row[2] || '').toString().trim();
          const successorPosition = (row[3] || '').toString().trim();
          const currentHolderName = (row[4] || '').toString().trim();
          const currentHolderPosition = (row[5] || '').toString().trim();
          const readinessPercent = parseReadinessPercent(row[6]);

          const hasAnyPerson = !!successorName || !!currentHolderName;
          if (!hasAnyPerson || readinessPercent === undefined) continue;

          links.push({
            id: `ready-link-${links.length + 1}`,
            employeeName: successorName || 'Vacant',
            employeeDepartment: currentDepartment,
            employeePosition: successorPosition || '',
            vacantPosition: currentHolderPosition || 'Unknown',
            readinessPercent,
            currentHolderName,
            currentHolderPosition,
          });
        }

        resolve(links);
      },
      error: (error) => reject(error),
    });
  });
};

export const fetchAttendanceData = (): Promise<AttendanceRecord[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(ATTENDANCE_CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length < 2) {
          resolve([]);
          return;
        }

        const headers = rows[0].map((header) => String(header || '').trim());
        let attendanceIdx = findHeaderIndex(headers, ['attendance %', 'attendance rate', 'attendance']);
        if (attendanceIdx < 0) {
          attendanceIdx = headers.findIndex(
            (header, index) => index >= 9 && /attendance|attendance %|attendance rate|%/i.test(header),
          );
        }

        const records: AttendanceRecord[] = [];
        for (const row of rows.slice(1)) {
          const name = (row[2] || '').toString().trim();
          const position = (row[3] || '').toString().trim();
          const department = (row[4] || '').toString().trim();
          if (!name || !department) continue;

          records.push({
            id: `att-${records.length + 1}`,
            name,
            position,
            department,
            shopLocation: (row[6] || '').toString().trim() || undefined,
            division: (row[7] || '').toString().trim() || undefined,
            attendancePercent: attendanceIdx >= 0 ? parseReadinessPercent(row[attendanceIdx]) : undefined,
          });
        }

        resolve(records);
      },
      error: (error) => reject(error),
    });
  });
};
