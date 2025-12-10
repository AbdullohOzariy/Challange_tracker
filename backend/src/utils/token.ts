import crypto from 'crypto';

export function generateVerificationToken(): string {
  // Generate a 6-digit code between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateId(prefix: string = ''): string {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${id}` : id;
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNumber(startDate: Date, currentDate: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
  return Math.floor((current - start) / msPerDay) + 1;
}

export function isDeadlinePassed(deadlineTime: string | null | undefined): boolean {
  if (!deadlineTime) return false;

  const now = new Date();
  const [deadlineHour, deadlineMinute] = deadlineTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour > deadlineHour) return true;
  if (currentHour === deadlineHour && currentMinute >= deadlineMinute) return true;
  return false;
}
