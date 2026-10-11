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

// Splits an amount in proportion to weights (for example days present).
// Uses the "largest remainder" method so the shares add up to exactly the total.
export function splitByWeights(totalPaise: number, items: { userId: number; weight: number }[]) {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight <= 0) throw new Error("Total weight must be above zero");

  const parts = items.map((i) => {
    const exact = (totalPaise * i.weight) / totalWeight;
    return { userId: i.userId, share: Math.floor(exact), fraction: exact - Math.floor(exact) };
  });

  let leftover = totalPaise - parts.reduce((sum, p) => sum + p.share, 0);
  const byFraction = [...parts].sort((a, b) => b.fraction - a.fraction);
  for (let k = 0; leftover > 0; k = (k + 1) % byFraction.length) {
    byFraction[k].share += 1;
    leftover -= 1;
  }

  return parts.map((p) => ({ userId: p.userId, share: p.share }));
}