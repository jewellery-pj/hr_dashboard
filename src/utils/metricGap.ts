export function formatGap(
  value: number,
  target: number,
  higherIsBetter: boolean,
  unit: string,
  decimals = 1,
): string {
  const fmt = (n: number) => (Number.isInteger(n) && decimals === 0 ? n.toString() : n.toFixed(decimals));

  if (higherIsBetter) {
    if (value >= target) return 'On target';
    return `${fmt(target - value)}${unit} short`;
  }
  if (value <= target) return 'On target';
  return `${fmt(value - target)}${unit} over`;
}

export type MetricStatus = 'green' | 'yellow' | 'red';

export function getMetricStatus(value: number, target: number, higherIsBetter: boolean): MetricStatus {
  if (higherIsBetter) {
    if (value >= target) return 'green';
    if (value >= target * 0.8) return 'yellow';
    return 'red';
  }
  if (value <= target) return 'green';
  if (value <= target * 1.5) return 'yellow';
  return 'red';
}
