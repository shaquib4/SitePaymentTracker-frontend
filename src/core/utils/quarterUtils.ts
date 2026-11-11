export type QuarterKey = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterRange {
  quarter: QuarterKey;
  year: number;
  startDate: string;
  endDate: string;
  label: string;
}

/**
 * Returns the exact ISO date range (YYYY-MM-DD) for a specific calendar quarter of a given year.
 */
export function getQuarterDateRange(
  year: number,
  quarter: QuarterKey
): { startDate: string; endDate: string; label: string } {
  switch (quarter) {
    case 'Q1':
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-03-31`,
        label: `Q1: Jan - Mar ${year}`,
      };
    case 'Q2':
      return {
        startDate: `${year}-04-01`,
        endDate: `${year}-06-30`,
        label: `Q2: Apr - Jun ${year}`,
      };
    case 'Q3':
      return {
        startDate: `${year}-07-01`,
        endDate: `${year}-09-30`,
        label: `Q3: Jul - Sep ${year}`,
      };
    case 'Q4':
      return {
        startDate: `${year}-10-01`,
        endDate: `${year}-12-31`,
        label: `Q4: Oct - Dec ${year}`,
      };
  }
}

/**
 * Dynamically calculates the immediately preceding calendar quarter based on the current date.
 * e.g. If current month is Nov 2026 (Q4), returns Q3 2026 (Jul 01 - Sep 30).
 * e.g. If current month is Feb 2026 (Q1), returns Q4 2025 (Oct 01 - Dec 31).
 */
export function getLastQuarterDateRange(refDate: Date = new Date()): QuarterRange {
  const currentMonth = refDate.getMonth(); // 0-indexed: 0=Jan, 11=Dec
  const currentYear = refDate.getFullYear();

  let lastQuarter: QuarterKey;
  let targetYear = currentYear;

  if (currentMonth >= 0 && currentMonth <= 2) {
    // Current is Q1 -> Last is Q4 of previous year
    lastQuarter = 'Q4';
    targetYear = currentYear - 1;
  } else if (currentMonth >= 3 && currentMonth <= 5) {
    // Current is Q2 -> Last is Q1 of current year
    lastQuarter = 'Q1';
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    // Current is Q3 -> Last is Q2 of current year
    lastQuarter = 'Q2';
  } else {
    // Current is Q4 -> Last is Q3 of current year
    lastQuarter = 'Q3';
  }

  const range = getQuarterDateRange(targetYear, lastQuarter);
  return {
    quarter: lastQuarter,
    year: targetYear,
    startDate: range.startDate,
    endDate: range.endDate,
    label: `Last Quarter (${lastQuarter} ${targetYear})`,
  };
}

/**
 * Calculates current quarter date range.
 */
export function getCurrentQuarterDateRange(refDate: Date = new Date()): QuarterRange {
  const currentMonth = refDate.getMonth();
  const currentYear = refDate.getFullYear();

  let q: QuarterKey;
  if (currentMonth <= 2) q = 'Q1';
  else if (currentMonth <= 5) q = 'Q2';
  else if (currentMonth <= 8) q = 'Q3';
  else q = 'Q4';

  const range = getQuarterDateRange(currentYear, q);
  return {
    quarter: q,
    year: currentYear,
    startDate: range.startDate,
    endDate: range.endDate,
    label: `Current Quarter (${q} ${currentYear})`,
  };
}

export type PresetKey =
  | 'all'
  | 'Q1'
  | 'Q2'
  | 'Q3'
  | 'Q4'
  | 'last_quarter'
  | 'last_30_days'
  | 'custom';

/**
 * Detects which preset matches the given start and end dates.
 */
export function detectActivePreset(
  startDate: string,
  endDate: string,
  year: number
): PresetKey {
  if (!startDate && !endDate) return 'all';

  const lastQ = getLastQuarterDateRange();
  if (startDate === lastQ.startDate && endDate === lastQ.endDate) {
    return 'last_quarter';
  }

  for (const q of ['Q1', 'Q2', 'Q3', 'Q4'] as QuarterKey[]) {
    const range = getQuarterDateRange(year, q);
    if (startDate === range.startDate && endDate === range.endDate) {
      return q;
    }
  }

  // Check rolling 30 days
  const today = new Date();
  const past = new Date();
  past.setDate(past.getDate() - 30);
  const s30 = past.toISOString().split('T')[0];
  const e30 = today.toISOString().split('T')[0];
  if (startDate === s30 && endDate === e30) {
    return 'last_30_days';
  }

  return 'custom';
}
