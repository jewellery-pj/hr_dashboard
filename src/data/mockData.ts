export interface Candidate {
  id: string;
  name: string;
  position: string;
  department: string;
  month: string;
  date: string; // Added date field
  cvStatus: 'Received';
  sentToHOD: boolean;
  firstInterview: boolean;
  secondInterview: boolean;
  finalStatus: 'Joined' | 'Rejected' | 'In Progress';
  joinedDate?: string; // Added joinedDate field
}

export interface Resignation {
  id: string;
  employeeCode?: string;
  name: string;
  gender?: string;
  department: string;
  designation?: string;
  division?: string;
  location?: string;
  doe?: string;
  serviceMonth?: string;
  resignationDate: string;
  resignStatus?: string;
  comment?: string;
  remarks?: string;
  month: string;
  // Keep these for backward compatibility if needed by other parts of the app
  position: string; 
  reason: string;
}

export interface ExitInterview {
  id: string;
  name: string;
  department: string;
  position: string;
  resignationDate: string;
  lastDate: string;
  reason: string;
  requestReason: string;
  hrReason: string;
  feedback?: string;
  month: string;
}

export interface Manpower {
  id: string;
  department: string;
  position: string;
  budgeted: number;
  actual: number;
  variance: number;
  month: string;
  shopLocation?: string;
  branch?: string;
  gender?: string;
}

export interface JobNetData {
  id: string;
  name: string;
  position: string;
  department: string;
  phNo: string;
  cvReceivedDate: string;
  firstInterviewDate: string;
  time: string;
  interviewScore: number;
  secondInterviewDate: string;
  remark: string;
}

const positions = [
  'Assistant', 'CA', 'Cashier', 'CCTV checker staff', 'Driver', 
  'Gold Goldsmith', 'Guard', 'Junior Account', 'Junior Auditor', 
  'Junior Sales', 'Junior Sales(online)', 'Manager', 'Office Staff', 
  'Purchaser', 'Senior Account', 'Senior Sales', 'Tailor', 'Tiktok Talent'
];

const departments = [
  'Admin', 'Audit', 'BOD Support Office', 'Finance & Account (Showroom)', 
  'Goldsmith Production', 'HR', 'Marketing', 'Procurement', 'Sales', 'Security'
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const names = [
  'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Ethan Hunt',
  'Fiona Gallagher', 'George Miller', 'Hannah Abbott', 'Ian Wright', 'Jane Doe',
  'Kevin Hart', 'Laura Palmer', 'Michael Scott', 'Nina Simone', 'Oscar Wilde',
  'Peter Parker', 'Quinn Fabray', 'Rachel Green', 'Steve Rogers', 'Tony Stark',
  'Ursula Corbero', 'Victor Hugo', 'Wanda Maximoff', 'Xavier Woods', 'Yara Shahidi',
  'Zoe Kravitz', 'Arthur Morgan', 'Billie Eilish', 'Cillian Murphy', 'Dua Lipa',
  'Elon Musk', 'Frank Ocean', 'Gigi Hadid', 'Harry Styles', 'Iris Apfel',
  'Jack Sparrow', 'Kendrick Lamar', 'Lana Del Rey', 'Meryl Streep', 'Neymar Jr',
  'Oprah Winfrey', 'Paul McCartney', 'Queen Latifah', 'Rihanna', 'Snoop Dogg',
  'Taylor Swift', 'Usain Bolt', 'Viola Davis', 'Will Smith', 'Zendaya'
];

const realDataCounts = [
  { dept: 'Admin', pos: 'Assistant', count: 1 },
  { dept: 'Admin', pos: 'CCTV checker staff', count: 2 },
  { dept: 'Admin', pos: 'Driver', count: 1 },
  { dept: 'Admin', pos: 'Purchaser', count: 1 },
  { dept: 'Audit', pos: 'Junior Auditor', count: 1 },
  { dept: 'BOD Support Office', pos: 'Manager', count: 1 },
  { dept: 'BOD Support Office', pos: 'Tailor', count: 1 },
  { dept: 'Finance & Account (Showroom)', pos: 'CA', count: 9 },
  { dept: 'Finance & Account (Showroom)', pos: 'Cashier', count: 7 },
  { dept: 'Finance & Account (Showroom)', pos: 'Junior Account', count: 2 },
  { dept: 'Finance & Account (Showroom)', pos: 'Office Staff', count: 9 },
  { dept: 'Finance & Account (Showroom)', pos: 'Senior Account', count: 2 },
  { dept: 'HR', pos: 'Gold Goldsmith', count: 3 },
  { dept: 'Marketing', pos: 'Manager', count: 2 },
  { dept: 'Marketing', pos: 'Tiktok Talent', count: 1 },
  { dept: 'Procurement', pos: 'Office Staff', count: 2 },
  { dept: 'Sales', pos: 'Junior Sales', count: 36 },
  { dept: 'Sales', pos: 'Junior Sales(online)', count: 2 },
  { dept: 'Sales', pos: 'Manager', count: 3 },
  { dept: 'Sales', pos: 'Senior Sales', count: 6 },
  { dept: 'Security', pos: 'Guard', count: 16 },
  { dept: 'Security', pos: 'Manager', count: 1 },
];

export const mockCandidates: Candidate[] = [];

let idCounter = 1;
realDataCounts.forEach(({ dept, pos, count }) => {
  for (let i = 0; i < count; i++) {
    const month = months[Math.floor(Math.random() * months.length)];
    const sentToHOD = Math.random() > 0.3;
    const firstInterview = sentToHOD && Math.random() > 0.4;
    const secondInterview = firstInterview && Math.random() > 0.5;
    
    let finalStatus: Candidate['finalStatus'] = 'In Progress';
    if (secondInterview) {
      finalStatus = Math.random() > 0.4 ? 'Joined' : 'Rejected';
    } else if (sentToHOD || firstInterview) {
      if (Math.random() > 0.7) finalStatus = 'Rejected';
    }

    let joinedDate: string | undefined = undefined;
    if (finalStatus === 'Joined') {
      joinedDate = '19.3.2026'; // Default for mock
    }

    mockCandidates.push({
      id: `cand-${idCounter++}`,
      name: `Candidate ${idCounter}`,
      position: pos,
      department: dept,
      month,
      date: 'Today', // Default for mock
      cvStatus: 'Received',
      sentToHOD,
      firstInterview,
      secondInterview,
      finalStatus,
      joinedDate,
    });
  }
});

export const mockResignations: Resignation[] = [
  { id: 'res-1', name: 'John Doe', position: 'Junior Sales', department: 'Sales', resignationDate: '15.3.2026', reason: 'Better Opportunity', month: 'Mar' },
  { id: 'res-2', name: 'Jane Smith', position: 'CA', department: 'Finance & Account (Showroom)', resignationDate: '10.3.2026', reason: 'Personal Issue', month: 'Mar' },
  { id: 'res-3', name: 'Mike Ross', position: 'Guard', department: 'Security', resignationDate: '05.2.2026', reason: 'Health Issue', month: 'Feb' },
  { id: 'res-4', name: 'Harvey Specter', position: 'Manager', department: 'Sales', resignationDate: '20.1.2026', reason: 'Better Opportunity', month: 'Jan' },
  { id: 'res-5', name: 'Donna Paulsen', position: 'Office Staff', department: 'Finance & Account (Showroom)', resignationDate: '12.3.2026', reason: 'Relocation', month: 'Mar' },
];

export const mockExitInterviews: ExitInterview[] = [
  { 
    id: 'exit-1', 
    name: 'Daw Ohnmar Kyaw', 
    department: 'BOD Support Office', 
    position: 'Assistant General Manager', 
    resignationDate: '12/26/25', 
    lastDate: '12/26/25',
    reason: 'Unknown', 
    requestReason: 'ကိုယ်ပိုင်စီးပွားရေးလုပ်ကိုင်ရန်',
    hrReason: 'ကိုယ်ပိုင်စီးပွားရေးလုပ်ကိုင်မည်ဖြစ်ပါသဖြင့်',
    feedback: 'Good environment but low pay', 
    month: 'Dec' 
  },
  { 
    id: 'exit-2', 
    name: 'U Yan Naing', 
    department: 'Goldsmith Production', 
    position: 'Manager', 
    resignationDate: '12/30/25', 
    lastDate: '12/30/25',
    reason: 'Unknown', 
    requestReason: 'ကိုယ်ပိုင်စီးပွားရေးလုပ်ကိုင်ရန်',
    hrReason: 'ကိုယ်ပိုင်စီးပွားရေးလုပ်ကိုင်မည်ဖြစ်ပါသဖြင့်',
    feedback: 'Family reasons', 
    month: 'Dec' 
  },
  { 
    id: 'exit-3', 
    name: 'U Chan Myae Kyaw', 
    department: 'Security', 
    position: 'Guard', 
    resignationDate: '12/29/25', 
    lastDate: '12/29/25',
    reason: 'Unknown', 
    requestReason: 'ကျန်းမာရေးမကောင်းပါသဖြင့်',
    hrReason: 'ကျန်းမာရေးမကောင်းပါသဖြင့် အလုပ်မှနုတ်ထွက်',
    feedback: 'Health issues', 
    month: 'Dec' 
  },
];

export const mockManpower: Manpower[] = [
  { id: 'mp-1', department: 'Sales', position: 'Junior Sales', budgeted: 40, actual: 36, variance: -4, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Male' },
  { id: 'mp-2', department: 'Security', position: 'Guard', budgeted: 20, actual: 16, variance: -4, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Male' },
  { id: 'mp-3', department: 'BOD Support Office', position: 'Deputy General Manager', budgeted: 5, actual: 3, variance: -2, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Female' },
  { id: 'mp-4', department: 'Goldsmith Production', position: 'Goldsmith', budgeted: 50, actual: 45, variance: -5, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (2)', branch: 'Mandalay', gender: 'Male' },
  { id: 'mp-5', department: 'Admin', position: 'Office Staff', budgeted: 10, actual: 8, variance: -2, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Female' },
  { id: 'mp-6', department: 'Marketing', position: 'Manager', budgeted: 5, actual: 4, variance: -1, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (2)', branch: 'Mandalay', gender: 'Female' },
  { id: 'mp-7', department: 'Finance & Account (Showroom)', position: 'CA', budgeted: 10, actual: 9, variance: -1, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Male' },
  { id: 'mp-8', department: 'Operations', position: 'Staff', budgeted: 25, actual: 20, variance: -5, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Male' },
  { id: 'mp-9', department: 'IT', position: 'Staff', budgeted: 15, actual: 15, variance: 0, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Male' },
  { id: 'mp-10', department: 'HR', position: 'Staff', budgeted: 12, actual: 12, variance: 0, month: 'Mar', shopLocation: 'ဆိုင်အမှတ် (1)', branch: 'Yangon', gender: 'Female' },
];
