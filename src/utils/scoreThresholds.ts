/** Central KPI thresholds used across scorecards and risk alerts. */
export const SCORE_THRESHOLDS = {
  turnover: {
    good: 5,
    warning: 10,
    critical: 15,
    severe: 25,
  },
  vacancyRate: {
    good: 3,
    chairmanTarget: 5,
    warning: 7,
    critical: 12,
    severe: 15,
  },
  vacancyCount: {
    good: 2,
    warning: 5,
    critical: 10,
  },
  attendance: {
    excellent: 95,
    good: 90,
    warning: 85,
  },
  manpowerShortage: {
    critical: 5,
    high: 8,
    severe: 15,
  },
  successionReadiness: {
    target: 80,
  },
  retention: {
    target: 90,
  },
  timeToFill: {
    targetDays: 15,
  },
} as const;
