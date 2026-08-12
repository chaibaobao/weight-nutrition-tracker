export function toLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateKey: string, days: number): string {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

export function formatFriendlyDate(dateKey: string, includeYear = false): string {
  const date = parseLocalDate(dateKey);
  const weekday = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][date.getDay()];
  return `${includeYear ? `${date.getFullYear()}年` : ''}${date.getMonth() + 1}月${date.getDate()}日 · ${weekday}`;
}

export function getAge(birthDate: string, onDate = new Date()): number {
  const birth = parseLocalDate(birthDate);
  let age = onDate.getFullYear() - birth.getFullYear();
  const beforeBirthday = onDate.getMonth() < birth.getMonth() || (onDate.getMonth() === birth.getMonth() && onDate.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return Math.max(0, age);
}

export function lastNDates(endDate: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDays(endDate, index - days + 1));
}
