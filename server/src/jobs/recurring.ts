import { prisma } from "../db";
import { splitEqual } from "../services/split";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// Creates this month's copy of every recurring bill that is due and not created yet.
export async function runRecurringBills(now: Date = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET);
  const day = ist.getUTCDate();
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, month, 1) - IST_OFFSET);
  const monthEnd = new Date(Date.UTC(year, month + 1, 1) - IST_OFFSET);

  // "lte" also catches bills whose day passed while the server was off
  const templates = await prisma.expense.findMany({
    where: { isRecurring: true, recurringDay: { lte: day } },
  });

  let created = 0;
  for (const t of templates) {
    const already = await prisma.expense.findFirst({
      where: { houseId: t.houseId, title: t.title, createdAt: { gte: monthStart, lt: monthEnd } },
    });
    if (already) continue;

    const members = await prisma.member.findMany({
      where: { houseId: t.houseId, leftAt: null },
      orderBy: { rotationOrder: "asc" },
    });
    if (members.length === 0) continue;

    const shares = splitEqual(t.amount, members.map((m) => m.userId));
    await prisma.expense.create({
      data: {
        houseId: t.houseId,
        paidById: t.paidById,
        title: t.title,
        category: t.category,
        amount: t.amount,
        splitType: "EQUAL",
        isRecurring: false,
        date: now,
        createdAt: now,
        splits: {
          create: shares.map((s) => ({
            userId: s.userId,
            share: s.share,
            isPaid: s.userId === t.paidById,
            paidAt: s.userId === t.paidById ? now : null,
          })),
        },
      },
    });
    created++;
  }
  return created;
}