import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// Monthly report: ?month=2026-10 (defaults to the current month in India)
router.get("/:houseId/report", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const member = await prisma.member.findUnique({
    where: { userId_houseId: { userId: req.userId!, houseId } },
  });
  if (!member || member.leftAt) return res.status(403).json({ error: "Not a member of this house" });

  const ist = new Date(Date.now() + IST_OFFSET);
  let year = ist.getUTCFullYear();
  let month = ist.getUTCMonth() + 1;
  const q = String(req.query.month ?? "");
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(q)) {
    year = Number(q.slice(0, 4));
    month = Number(q.slice(5, 7));
  }

  const start = new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET);
  const end = new Date(Date.UTC(year, month, 1) - IST_OFFSET);

  const expenses = await prisma.expense.findMany({
    where: { houseId, date: { gte: start, lt: end } },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  let totalPaise = 0;
  const byCategory = new Map<string, number>();
  const people = new Map<number, { name: string; paid: number; share: number }>();

  const person = (id: number, name: string) => {
    if (!people.has(id)) people.set(id, { name, paid: 0, share: 0 });
    return people.get(id)!;
  };

  for (const e of expenses) {
    totalPaise += e.amount;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
    person(e.paidBy.id, e.paidBy.name).paid += e.amount;
    for (const s of e.splits) person(s.user.id, s.user.name).share += s.share;
  }

  res.json({
    month: `${year}-${String(month).padStart(2, "0")}`,
    billCount: expenses.length,
    totalRupees: totalPaise / 100,
    byCategory: [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amountRupees: amount / 100 }))
      .sort((a, b) => b.amountRupees - a.amountRupees),
    people: [...people.values()]
      .map((p) => ({ name: p.name, paidRupees: p.paid / 100, shareRupees: p.share / 100 }))
      .sort((a, b) => b.paidRupees - a.paidRupees),
  });
});

export default router;