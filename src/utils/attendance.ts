import { AttendanceRecord } from '../data/mockData';

export function averageAttendance(
  records: AttendanceRecord[],
  predicate: (record: AttendanceRecord) => boolean,
): number | null {
  const values = records
    .filter(predicate)
    .map((record) => record.attendancePercent)
    .filter((value): value is number => value !== undefined);

  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
