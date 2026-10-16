import type { ViewMode } from "@/lib/validation";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDate(value: string): Date {
  return new Date(value + "T00:00:00Z");
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function diffInDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function startOfWeek(date: Date): Date {
  const day = date.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  return addDays(date, -diff);
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export const PX_PER_DAY: Record<ViewMode, number> = {
  day: 42,
  week: 15,
  month: 5.2,
};

export const ROW_HEIGHT = 40;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface TimelineColumn {
  key: string;
  label: string;
  subLabel?: string;
  left: number;
  width: number;
  isWeekend?: boolean;
  isMonthStart?: boolean;
}

export interface TimelineInfo {
  rangeStart: Date;
  rangeEnd: Date;
  totalWidth: number;
  pxPerDay: number;
  columns: TimelineColumn[];
  topColumns: TimelineColumn[];
}

export function buildTimeline(
  projectStart: string,
  projectEnd: string,
  viewMode: ViewMode
): TimelineInfo {
  const start = parseDate(projectStart);
  const end = parseDate(projectEnd);
  const pxPerDay = PX_PER_DAY[viewMode];

  let rangeStart: Date;
  let rangeEnd: Date;

  if (viewMode === "month") {
    rangeStart = startOfMonth(start);
    const endMonthStart = startOfMonth(end);
    rangeEnd = addMonths(endMonthStart, 1);
  } else if (viewMode === "week") {
    rangeStart = startOfWeek(start);
    const endWeekStart = startOfWeek(end);
    rangeEnd = addDays(endWeekStart, 7);
  } else {
    rangeStart = start;
    rangeEnd = addDays(end, 1);
  }

  const totalDays = diffInDays(rangeStart, rangeEnd);
  const totalWidth = totalDays * pxPerDay;

  const columns: TimelineColumn[] = [];
  const topColumns: TimelineColumn[] = [];

  if (viewMode === "day") {
    let cursor = rangeStart;
    let monthCursor = -1;
    let monthStartLeft = 0;
    let monthLabel = "";
    let dayIndex = 0;
    while (cursor.getTime() < rangeEnd.getTime()) {
      const left = dayIndex * pxPerDay;
      const dow = cursor.getUTCDay();
      columns.push({
        key: formatDate(cursor),
        label: String(cursor.getUTCDate()),
        subLabel: WEEKDAY_LABELS[dow],
        left,
        width: pxPerDay,
        isWeekend: dow === 0 || dow === 6,
      });
      const m = cursor.getUTCMonth() + cursor.getUTCFullYear() * 12;
      if (m !== monthCursor) {
        if (monthCursor !== -1) {
          topColumns.push({ key: monthLabel + monthStartLeft, label: monthLabel, left: monthStartLeft, width: left - monthStartLeft });
        }
        monthCursor = m;
        monthStartLeft = left;
        monthLabel = `${MONTH_LABELS[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`;
      }
      cursor = addDays(cursor, 1);
      dayIndex += 1;
    }
    topColumns.push({ key: monthLabel + monthStartLeft, label: monthLabel, left: monthStartLeft, width: totalWidth - monthStartLeft });
  } else if (viewMode === "week") {
    let cursor = rangeStart;
    let weekIndex = 0;
    let monthCursor = -1;
    let monthStartLeft = 0;
    let monthLabel = "";
    while (cursor.getTime() < rangeEnd.getTime()) {
      const left = weekIndex * 7 * pxPerDay;
      const width = 7 * pxPerDay;
      const weekEnd = addDays(cursor, 6);
      columns.push({
        key: formatDate(cursor),
        label: `${cursor.getUTCDate()} ${MONTH_LABELS[cursor.getUTCMonth()].slice(0, 3)}`,
        subLabel: `– ${weekEnd.getUTCDate()} ${MONTH_LABELS[weekEnd.getUTCMonth()].slice(0, 3)}`,
        left,
        width,
      });
      const m = cursor.getUTCMonth() + cursor.getUTCFullYear() * 12;
      if (m !== monthCursor) {
        if (monthCursor !== -1) {
          topColumns.push({ key: monthLabel + monthStartLeft, label: monthLabel, left: monthStartLeft, width: left - monthStartLeft });
        }
        monthCursor = m;
        monthStartLeft = left;
        monthLabel = `${MONTH_LABELS[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}`;
      }
      cursor = addDays(cursor, 7);
      weekIndex += 1;
    }
    topColumns.push({ key: monthLabel + monthStartLeft, label: monthLabel, left: monthStartLeft, width: totalWidth - monthStartLeft });
  } else {
    let cursor = rangeStart;
    let monthIndex = 0;
    let yearCursor = -1;
    let yearStartLeft = 0;
    let yearLabel = "";
    while (cursor.getTime() < rangeEnd.getTime()) {
      const nextMonth = addMonths(cursor, 1);
      const daysInMonth = diffInDays(cursor, nextMonth);
      const left = diffInDays(rangeStart, cursor) * pxPerDay;
      const width = daysInMonth * pxPerDay;
      columns.push({
        key: formatDate(cursor),
        label: MONTH_LABELS[cursor.getUTCMonth()].slice(0, 3),
        subLabel: String(cursor.getUTCFullYear()),
        left,
        width,
        isMonthStart: true,
      });
      const y = cursor.getUTCFullYear();
      if (y !== yearCursor) {
        if (yearCursor !== -1) {
          topColumns.push({ key: String(yearCursor), label: String(yearCursor), left: yearStartLeft, width: left - yearStartLeft });
        }
        yearCursor = y;
        yearStartLeft = left;
        yearLabel = String(y);
      }
      cursor = nextMonth;
      monthIndex += 1;
    }
    topColumns.push({ key: yearLabel + yearStartLeft, label: yearLabel, left: yearStartLeft, width: totalWidth - yearStartLeft });
  }

  return { rangeStart, rangeEnd, totalWidth, pxPerDay, columns, topColumns };
}

export function barGeometry(
  timeline: TimelineInfo,
  taskStart: string,
  taskEnd: string
): { left: number; width: number } {
  const start = parseDate(taskStart);
  const end = parseDate(taskEnd);
  const left = diffInDays(timeline.rangeStart, start) * timeline.pxPerDay;
  const durationDays = diffInDays(start, end) + 1;
  const width = Math.max(durationDays * timeline.pxPerDay, 6);
  return { left, width };
}

export function todayOffset(timeline: TimelineInfo): number | null {
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (todayUtc < timeline.rangeStart || todayUtc >= timeline.rangeEnd) return null;
  return diffInDays(timeline.rangeStart, todayUtc) * timeline.pxPerDay;
}

export function durationLabel(startDate: string, endDate: string): string {
  const days = diffInDays(parseDate(startDate), parseDate(endDate)) + 1;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}
