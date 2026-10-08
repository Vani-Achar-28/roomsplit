// Splits an amount (in paise) equally. Leftover paise go to the first people,
// so the shares always add up to exactly the total.
export function splitEqual(totalPaise: number, userIds: number[]) {
  const n = userIds.length;
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise % n;
  return userIds.map((userId, i) => ({
    userId,
    share: base + (i < remainder ? 1 : 0),
  }));
}