/**
 * Date Range Utility — Shared across all dashboard endpoints
 * Handles: preset shortcuts, custom range validation, auto granularity,
 *          comparison period calculation, KPI card building
 *
 * Reference: canteen-dashboard-full-analysis.md
 * Adapted for actual codebase (ESM imports, lowercase enums)
 */
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, subDays, subMonths,
  subQuarters, subYears, differenceInDays,
  isValid,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import mongoose from 'mongoose';

export const TIMEZONE = 'Asia/Ho_Chi_Minh'; // ICT = UTC+7
const MAX_RANGE_DAYS    = 730;  // tối đa 2 năm
const MAX_HISTORY_YEARS = 3;    // không xem data cũ hơn 3 năm

// ─────────────────────────────────────────────
// Helper: lấy "thời điểm hiện tại" theo ICT
// ─────────────────────────────────────────────
const nowICT = () => toZonedTime(new Date(), TIMEZONE);

// ─────────────────────────────────────────────
// Helper: parse date string "YYYY-MM-DD" thành Date theo ICT
// Explicit +07:00 offset — không phụ thuộc server timezone
// ─────────────────────────────────────────────
const parseDateStringICT = (dateStr, timeStr = '00:00:00') => {
  const isoString = `${dateStr}T${timeStr}+07:00`;
  const date = new Date(isoString);
  return isValid(date) ? date : null;
};

// ─────────────────────────────────────────────
// Validate canteenId từ JWT
// ─────────────────────────────────────────────
export const validateCanteenId = (canteenId) => {
  if (!canteenId) return { error: 'No canteen assigned to this account' };
  if (!mongoose.Types.ObjectId.isValid(canteenId)) return { error: 'Invalid canteen ID format' };
  return { canteenObjId: new mongoose.Types.ObjectId(canteenId) };
};

// ─────────────────────────────────────────────
// Preset → { from, to } theo ICT → trả về UTC
// ─────────────────────────────────────────────
const getPresetRange = (preset) => {
  const now    = nowICT();
  const nowUTC = new Date();

  const presets = {
    today:        { from: fromZonedTime(startOfDay(now), TIMEZONE),   to: nowUTC },
    this_week:    { from: fromZonedTime(startOfWeek(now, { weekStartsOn: 1 }), TIMEZONE), to: nowUTC },
    this_month:   { from: fromZonedTime(startOfMonth(now), TIMEZONE), to: nowUTC },
    this_quarter: { from: fromZonedTime(startOfQuarter(now), TIMEZONE), to: nowUTC },
    this_year:    { from: fromZonedTime(startOfYear(now), TIMEZONE),  to: nowUTC },

    yesterday:    {
      from: fromZonedTime(startOfDay(subDays(now, 1)), TIMEZONE),
      to:   fromZonedTime(endOfDay(subDays(now, 1)), TIMEZONE),
    },
    last_week:    {
      from: fromZonedTime(startOfWeek(subDays(now, 7), { weekStartsOn: 1 }), TIMEZONE),
      to:   fromZonedTime(endOfWeek(subDays(now, 7), { weekStartsOn: 1 }), TIMEZONE),
    },
    last_month:   {
      from: fromZonedTime(startOfMonth(subMonths(now, 1)), TIMEZONE),
      to:   fromZonedTime(endOfMonth(subMonths(now, 1)), TIMEZONE),
    },
    last_quarter: {
      from: fromZonedTime(startOfQuarter(subQuarters(now, 1)), TIMEZONE),
      to:   fromZonedTime(endOfQuarter(subQuarters(now, 1)), TIMEZONE),
    },
    last_year:    {
      from: fromZonedTime(startOfYear(subYears(now, 1)), TIMEZONE),
      to:   fromZonedTime(endOfYear(subYears(now, 1)), TIMEZONE),
    },
  };

  const range = presets[preset];
  if (!range) return { error: `Invalid preset "${preset}". Valid: ${Object.keys(presets).join(', ')}` };
  return range;
};

// ─────────────────────────────────────────────
// Custom range validate + parse
// ─────────────────────────────────────────────
const getCustomRange = (fromStr, toStr) => {
  const fromDate = parseDateStringICT(fromStr, '00:00:00');
  const toDate   = parseDateStringICT(toStr, '23:59:59');

  if (!fromDate) return { error: `Invalid "from" date format. Expected YYYY-MM-DD, got: "${fromStr}"` };
  if (!toDate)   return { error: `Invalid "to" date format. Expected YYYY-MM-DD, got: "${toStr}"` };

  const nowUTC     = new Date();
  const nowICTDate = nowICT();

  // from không được ở tương lai
  const tomorrowICT = startOfDay(subDays(nowICTDate, -1));
  const fromDateICT = toZonedTime(fromDate, TIMEZONE);
  if (fromDateICT >= tomorrowICT) {
    return { error: '"from" date cannot be in the future.' };
  }

  // to không được ở tương lai
  if (toDate > nowUTC) {
    return { error: '"to" date cannot be in the future' };
  }

  // from phải trước to
  if (fromDate >= toDate) {
    return { error: '"from" must be before "to"' };
  }

  // from không được quá xa
  const oldestAllowed = fromZonedTime(
    startOfYear(subYears(nowICTDate, MAX_HISTORY_YEARS)),
    TIMEZONE,
  );
  if (fromDate < oldestAllowed) {
    return { error: `"from" cannot be earlier than ${MAX_HISTORY_YEARS} years ago` };
  }

  // Khoảng cách tối đa
  const daysDiff = differenceInDays(toDate, fromDate);
  if (daysDiff > MAX_RANGE_DAYS) {
    return { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days. Got: ${daysDiff} days` };
  }

  return { from: fromDate, to: toDate };
};

// ─────────────────────────────────────────────
// Auto granularity theo số ngày (Shopify pattern)
// ─────────────────────────────────────────────
export const autoGranularity = (from, to) => {
  const days = differenceInDays(to, from);
  if (days <= 1)   return 'hour';
  if (days <= 14)  return 'day';
  if (days <= 90)  return 'week';
  if (days <= 365) return 'month';
  return 'quarter';
};

// ─────────────────────────────────────────────
// Main parser — dùng ở mọi dashboard endpoint
// ─────────────────────────────────────────────
export const parseDateRange = (query) => {
  const { preset, from, to, granularity } = query;

  // preset + from/to cùng lúc → lỗi rõ ràng
  if (preset && (from || to)) {
    return { error: 'Cannot use "preset" together with "from"/"to". Use one or the other.' };
  }

  let range;

  if (preset) {
    range = getPresetRange(preset);
    if (range.error) return range;
  } else if (from && to) {
    range = getCustomRange(from, to);
    if (range.error) return range;
  } else if (from || to) {
    return { error: 'Both "from" and "to" are required when not using a preset' };
  } else {
    range = getPresetRange('today');
  }

  // Validate + resolve granularity
  const VALID_GRANULARITIES = ['hour', 'day', 'week', 'month', 'quarter', 'year'];
  let resolvedGranularity;

  if (granularity) {
    if (!VALID_GRANULARITIES.includes(granularity)) {
      return { error: `Invalid granularity "${granularity}". Valid: ${VALID_GRANULARITIES.join(', ')}` };
    }
    resolvedGranularity = granularity;
  } else {
    resolvedGranularity = autoGranularity(range.from, range.to);
  }

  // Tính comparison period — cùng độ dài, ngay trước kỳ hiện tại
  const rangeDurationMs = range.to.getTime() - range.from.getTime();
  const comparison = {
    from: new Date(range.from.getTime() - rangeDurationMs),
    to:   new Date(range.to.getTime()   - rangeDurationMs),
  };

  return {
    from:        range.from,
    to:          range.to,
    granularity: resolvedGranularity,
    comparison,
    meta: {
      fromISO:           range.from.toISOString(),
      toISO:             range.to.toISOString(),
      comparisonFromISO: comparison.from.toISOString(),
      comparisonToISO:   comparison.to.toISOString(),
      granularity:       resolvedGranularity,
      generatedAt:       new Date().toISOString(),
      isRealtime: !!preset && ['today', 'this_week', 'this_month', 'this_quarter', 'this_year'].includes(preset),
    },
  };
};

// ─────────────────────────────────────────────
// Build group _id theo granularity cho MongoDB aggregation
// ─────────────────────────────────────────────
export const buildTimeSeriesGroupId = (granularity) => {
  const tz = TIMEZONE;
  const base = {
    year:  { $year:  { date: '$createdAt', timezone: tz } },
    month: { $month: { date: '$createdAt', timezone: tz } },
  };
  switch (granularity) {
    case 'hour':
      return { ...base, day: { $dayOfMonth: { date: '$createdAt', timezone: tz } }, hour: { $hour: { date: '$createdAt', timezone: tz } } };
    case 'day':
      return { ...base, day: { $dayOfMonth: { date: '$createdAt', timezone: tz } } };
    case 'week':
      return { year: base.year, week: { $isoWeek: { date: '$createdAt', timezone: tz } } };
    case 'month':
      return base;
    case 'quarter':
      return { year: base.year, quarter: { $ceil: { $divide: [{ $month: { date: '$createdAt', timezone: tz } }, 3] } } };
    case 'year':
      return { year: base.year };
    default:
      return base;
  }
};

// ─────────────────────────────────────────────
// Format time series → chart-ready format
// ─────────────────────────────────────────────
export const formatLabel = (id, granularity) => {
  switch (granularity) {
    case 'hour':    return `${String(id.hour).padStart(2, '0')}:00`;
    case 'day':     return `${String(id.day).padStart(2, '0')}/${String(id.month).padStart(2, '0')}`;
    case 'week':    return `T${id.week}/${id.year}`;
    case 'month':   return `${String(id.month).padStart(2, '0')}/${id.year}`;
    case 'quarter': return `Q${id.quarter}/${id.year}`;
    case 'year':    return `${id.year}`;
    default:        return JSON.stringify(id);
  }
};

// ─────────────────────────────────────────────
// Build KPI card với delta so kỳ trước
// ─────────────────────────────────────────────
export const buildKPI = (label, current, previous) => {
  let delta;
  if (previous === 0 && current === 0) {
    delta = { value: 0, display: '0%', trend: 'neutral' };
  } else if (previous === 0) {
    delta = { value: null, display: 'N/A', trend: 'up' };
  } else {
    const rate = +(((current - previous) / previous * 100).toFixed(1));
    delta = {
      value:   rate,
      display: rate >= 0 ? `+${rate}%` : `${rate}%`,
      trend:   rate > 0 ? 'up' : rate < 0 ? 'down' : 'neutral',
    };
  }
  return { label, value: current, delta, comparisonValue: previous };
};
