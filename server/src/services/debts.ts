export type Balance = { userId: number; net: number }; // paise, + is owed money, - owes money
export type Transfer = { fromUserId: number; toUserId: number; amount: number };

// Turns net balances into the fewest payments that settle everyone.
export function simplifyDebts(balances: Balance[]): Transfer[] {
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ ...b })).sort((a, b) => b.net - a.net);
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ userId: b.userId, net: -b.net })).sort((a, b) => b.net - a.net);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].net, creditors[j].net);
    transfers.push({ fromUserId: debtors[i].userId, toUserId: creditors[j].userId, amount: pay });
    debtors[i].net -= pay;
    creditors[j].net -= pay;
    if (debtors[i].net === 0) i++;
    if (creditors[j].net === 0) j++;
  }
  return transfers;
}