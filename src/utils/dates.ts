import { DateTime } from 'luxon';

export function isValidIanaTimezone(tz: string): boolean {
  return DateTime.now().setZone(tz).isValid;
}

export function dayBoundsInZone(
  instant: Date,
  tz: string,
): { start: Date; end: Date } {
  const dt = DateTime.fromJSDate(instant).setZone(tz);
  if (!dt.isValid) {
    throw new Error(`Invalid IANA timezone: ${tz}`);
  }
  return {
    start: dt.startOf('day').toJSDate(),
    end: dt.endOf('day').toJSDate(),
  };
}

export function userToday(tz: string): string {
  const today = DateTime.now().setZone(tz).toISODate();
  if (!today) throw new Error(`Invalid IANA timezone: ${tz}`);
  return today;
}
