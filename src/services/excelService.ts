import Papa from 'papaparse';
import { Candidate, Resignation, ExitInterview, Manpower } from '../data/mockData';

const RECRUITMENT_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=0';
const RESIGNATION_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=421155818';
const EXIT_INTERVIEW_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=773827159';
const MANPOWER_CSV_URL = 'https://docs.google.com/spreadsheets/d/13LQw9Xl8lc7hbCh0ZpScvQMrPjSZPpmVjPWjpy5ASmE/export?format=csv&gid=286117473';

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const normalizeMonth = (m: string): string => {
  if (!m) return 'Mar';
  const lower = m.toLowerCase().trim();
  const monthsMap: Record<string, string> = {
    'january': 'Jan', 'february': 'Feb', 'march': 'Mar', 'april': 'Apr',
    'may': 'May', 'june': 'Jun', 'july': 'Jul', 'august': 'Aug',
    'september': 'Sep', 'october': 'Oct', 'november': 'Nov', 'december': 'Dec',
    'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr',
    'jun': 'Jun', 'jul': 'Jul', 'aug': 'Aug', 'sep': 'Sep',
    'oct': 'Oct', 'nov': 'Nov', 'dec': 'Dec'
  };
  return monthsMap[lower] || m;
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

            const name = getVal(['Name', 'အမည်', 'Candidate Name']) || `Candidate ${index + 1}`;
            const position = getVal(['Position', 'ရာထူး', 'Designation', 'Job Title']) || 'Unknown';
            const department = getVal(['Department', 'ဌာန', 'Dept', 'Division']) || 'Unknown';
            const rawMonth = getVal(['Month', 'လ', 'Month of CV']) || 'Mar';
            const month = normalizeMonth(rawMonth);
            const date = getVal(['CV ရရှိသည့် ရက်', 'Date', 'CV Received Date', 'CV Date']) || 'Today';
            const joinedDate = getVal(['Joined Date', 'Join Date', 'New Join Date', 'ဝင်ရောက်သည့်ရက်']);
            
            const sentToHODVal = getVal(['Sent to HOD', 'HOD', 'HOD သို့ ပေးပို့ပြီး', 'HOD Sent']);
            const sentToHOD = sentToHODVal?.toLowerCase() === 'yes' || sentToHODVal === '1' || sentToHODVal?.toLowerCase() === 'y' || !!sentToHODVal;

            const firstIntVal = getVal(['1st Interview', 'ပထမအကြိမ် အင်တာဗျူး', 'First Interview', '1st Int']);
            const firstInterview = firstIntVal?.toLowerCase() === 'yes' || firstIntVal === '1' || firstIntVal?.toLowerCase() === 'y' || !!firstIntVal;

            const secondIntVal = getVal(['2nd Interview', 'ဒုတိယအကြိမ် အင်တာဗျူး', 'Second Interview', '2nd Int']);
            const secondInterview = secondIntVal?.toLowerCase() === 'yes' || secondIntVal === '1' || secondIntVal?.toLowerCase() === 'y' || !!secondIntVal;

            const finalStatusVal = getVal(['Final Status', 'နောက်ဆုံးအခြေအနေ', 'Status', 'Result']) || 'In Progress';
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
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const resignations: Resignation[] = data
          .filter(row => row.Name || row['အမည်'] || row.Department || row['ဌာန'])
          .map((row, index) => {
            const rawDate = row['Last Working D'] || row['Last Working Date'] || row['Resignation Date'] || row['ထွက်သည့်ရက်'] || row['Date'] || '';
            let month = row.Month || row['လ'] || 'Unknown';
            
            // Try to extract month from date if missing
            if (month === 'Unknown' && rawDate) {
              const dateParts = rawDate.split(/[./-]/);
              if (dateParts.length >= 2) {
                // The user says format is mm/dd/yyyy or dd/mm/yyyy
                // Let's try to be smart. If first part > 12, it's dd.
                let mIdx = -1;
                const p1 = parseInt(dateParts[0]);
                const p2 = parseInt(dateParts[1]);
                if (p1 > 12) mIdx = p2 - 1;
                else mIdx = p1 - 1;

                if (mIdx >= 0 && mIdx < 12) {
                  month = months[mIdx];
                }
              }
            }

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
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const exitInterviews: ExitInterview[] = data
          .filter(row => row.Name || row['Employee Name'] || row['အမည်'])
          .map((row, index) => {
            const rawDate = row['Resignation Date'] || row['Date'] || row['ထွက်သည့်ရက်'] || '';
            let month = row.Month || row['လ'] || 'Unknown';
            
            if (month === 'Unknown' && rawDate) {
              const dateParts = rawDate.split(/[./-]/);
              if (dateParts.length >= 2) {
                let mIdx = -1;
                const p1 = parseInt(dateParts[0]);
                const p2 = parseInt(dateParts[1]);
                if (p1 > 12) mIdx = p2 - 1;
                else mIdx = p1 - 1;

                if (mIdx >= 0 && mIdx < 12) {
                  month = months[mIdx];
                }
              }
            }

            return {
              id: `exit-${index + 1}`,
              name: row['Employee Name'] || row.Name || row['အမည်'] || `Employee ${index + 1}`,
              department: row.Department || row['ဌာန'] || 'Unknown',
              position: row.Position || row.Designation || row['ရာထူး'] || 'Unknown',
              resignationDate: rawDate,
              lastDate: row['Last Date'] || row['ထွက်သည့်ရက်'] || rawDate,
              reason: row['Reason for Leaving'] || row.Reason || row['ထွက်ရသည့်အကြောင်းရင်း'] || 'Unknown',
              requestReason: row['Request Reason'] || row['Request Reaso'] || row['အကြောင်းပြချက်'] || 'Unknown',
              hrReason: row['HR Reason'] || row['HR မှ မှတ်ချက်'] || 'Unknown',
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
        
        // The user says "role 5" is Department and "role 7" is Shop Location.
        // Based on the image:
        // A(0): No, B(1): CODE, C(2): FP No, D(3): Name, E(4): Position, F(5): Dept, G(6): Section, H(7): Shop Location
        // So Dept is index 5, Shop Location is index 7.
        
        // Since it's an employee list, we aggregate by Dept, Position, and Location
        const aggregated = rows.reduce((acc, row) => {
          const dept = row[5] || 'Unknown';
          const pos = row[4] || 'Unknown';
          const loc = row[7] || 'Unknown';
          const month = row[11] || 'Mar'; // Assuming month might be further right or default
          
          if (dept === 'Unknown' && pos === 'Unknown') return acc;
          
          const key = `${dept}|${pos}|${loc}`;
          if (!acc[key]) {
            acc[key] = {
              department: dept,
              position: pos,
              shopLocation: loc,
              month: month,
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
        }));
        
        resolve(manpower);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
