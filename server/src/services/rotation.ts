// Today's date in Indian time (IST), as a date at midnight UTC
export function todayIST(): Date {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

// Which member does this chore go to on this date?
// Every day the chores shift by one person.
export function memberIndexFor(choreIndex: number, memberCount: number, date: Date): number {
  const dayNumber = Math.floor(date.getTime() / 86400000);
  return (((choreIndex + dayNumber) % memberCount) + memberCount) % memberCount;
}