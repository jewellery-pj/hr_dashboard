import { ExitInterview } from '../data/mockData';

export function normalizeExitReason(reason: string): string {
  const lower = reason.toLowerCase().trim();
  if (!lower || lower === 'unknown') return 'Other';

  if (lower.includes('salary') || lower.includes('compensation') || lower.includes('pay')) return 'Salary';
  if (lower.includes('family') || lower.includes('personal') || lower.includes('home')) return 'Family';
  if (lower.includes('supervisor') || lower.includes('manager') || lower.includes('boss')) return 'Supervisor Issue';
  if (lower.includes('career') || lower.includes('growth') || lower.includes('promotion')) return 'Career Growth';
  if (lower.includes('health') || lower.includes('medical')) return 'Health';
  if (lower.includes('relocate') || lower.includes('location') || lower.includes('distance')) return 'Relocation';
  if (lower.includes('better') || lower.includes('opportunity') || lower.includes('new job')) return 'Better Opportunity';
  if (lower.includes('work environment') || lower.includes('culture')) return 'Work Environment';

  if (reason.includes('လစာ') || reason.includes('ကြေး') || reason.includes('ရှာ')) return 'Salary';
  if (reason.includes('မိသားစု') || reason.includes('ကိုယ်ပိုင်') || reason.includes('အိမ်') || reason.includes('ပုဂ္ဂလ') || reason.includes('အိမ်ထောင်ရေး')) return 'Family';
  if (reason.includes('ကြီးကြပ်') || reason.includes('မန်နေဂျာ') || reason.includes('သူဌေး')) return 'Supervisor Issue';
  if (reason.includes('အခွင့်အလမ်း') || reason.includes('တိုးတက်') || reason.includes('ရာထူး')) return 'Career Growth';
  if (reason.includes('ကျန်းမာ') || reason.includes('ဆေး')) return 'Health';
  if (reason.includes('ပြောင်း') || reason.includes('နေရာ') || reason.includes('နယ်ပြန်') || reason.includes('နိုင်ငံခြား')) return 'Relocation';
  if (reason.includes('အလုပ်သစ်') || reason.includes('ကောင်းကောင်း') || reason.includes('စီးပွား')) return 'Better Opportunity';
  if (reason.includes('ပတ်ဝန်းကျင်') || reason.includes('ယဉ်ကျေးမှု')) return 'Work Environment';

  return 'Other';
}

function isUsableReason(value?: string): boolean {
  if (!value) return false;
  const t = value.trim().toLowerCase();
  return t !== '' && t !== 'unknown' && t !== 'n/a';
}

/** What the employee stated (request form / interview). */
export function getEmployeeReasonCategory(e: ExitInterview): string {
  const raw = [e.requestReason, e.reason].find(isUsableReason) || '';
  return normalizeExitReason(raw);
}

/** HR classification after exit interview — preferred for executive reporting. */
export function getHrReasonCategory(e: ExitInterview): string {
  const raw = [e.hrReason, e.requestReason, e.reason].find(isUsableReason) || '';
  return normalizeExitReason(raw);
}

/** Single executive reason: HR classification first, then employee stated. */
export function getExecutiveReasonCategory(e: ExitInterview): string {
  if (isUsableReason(e.hrReason)) return normalizeExitReason(e.hrReason);
  if (isUsableReason(e.requestReason)) return normalizeExitReason(e.requestReason);
  if (isUsableReason(e.reason)) return normalizeExitReason(e.reason);
  return 'Other';
}

export function hasReasonMismatch(e: ExitInterview): boolean {
  const emp = getEmployeeReasonCategory(e);
  const hr = getHrReasonCategory(e);
  const hasBoth =
    (isUsableReason(e.requestReason) || isUsableReason(e.reason)) &&
    isUsableReason(e.hrReason);
  return hasBoth && emp !== hr && emp !== 'Other' && hr !== 'Other';
}

export const REASON_COLORS: Record<string, string> = {
  Salary: 'text-rose-600',
  Family: 'text-amber-600',
  'Supervisor Issue': 'text-purple-600',
  'Career Growth': 'text-blue-600',
  Health: 'text-teal-600',
  Relocation: 'text-indigo-600',
  'Better Opportunity': 'text-emerald-600',
  'Work Environment': 'text-pink-600',
  Other: 'text-slate-500',
};

export const SALARY_HIGH_THRESHOLD = 30;
export const SUPERVISOR_HIGH_THRESHOLD = 10;
export const CAREER_GROWTH_THRESHOLD = 8;
