import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { splitEqual, splitByWeights } from "../services/split";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(2),
  category: z.string().default("General"),
  amountRupees: z.number().positive(),
  isRecurring: z.boolean().default(false),
  recurringDay: z.number().int().min(1).max(28).optional(),
  // Optional: split by days present instead of equally
  daysPresent: z
    .array(z.object({ userId: z.number().int(), days: z.number().min(0).max(31) }))
    .optional(),
});

async function getMembership(userId: number, houseId: number) {
  const m = await prisma.member.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return m && !m.leftAt ? m : null;
}

// Admin adds a bill -> split among all current members
router.post("/:houseId/expenses", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role !== "ADMIN") return res.status(403).json({ error: "Only the admin can add bills" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const d = parsed.data;

  const members = await prisma.member.findMany({
    where: { houseId, leftAt: null },
    orderBy: { rotationOrder: "asc" },
  });
  const memberIds = members.map((m) => m.userId);

  const totalPaise = Math.round(d.amountRupees * 100);
  let shares: { userId: number; share: number }[];
  let splitType: "EQUAL" | "CUSTOM" = "EQUAL";

  if (d.daysPresent && d.daysPresent.length > 0) {
    const daysMap = new Map(d.daysPresent.map((x) => [x.userId, x.days]));
    if (d.daysPresent.some((x) => !memberIds.includes(x.userId))) {
      return res.status(400).json({ error: "Days include someone who is not in this house" });
    }
    const weights = memberIds.map((userId) => ({ userId, weight: daysMap.get(userId) ?? 0 }));
    if (weights.every((w) => w.weight === 0)) {
      return res.status(400).json({ error: "Enter days present for at least one person" });
    }
    shares = splitByWeights(totalPaise, weights);
    splitType = "CUSTOM";
  } else {
    shares = splitEqual(totalPaise, memberIds);
  }

  const expense = await prisma.expense.create({
    data: {
      houseId,
      paidById: me.userId,
      title: d.title,
      category: d.category,
      amount: totalPaise,
      splitType,
      isRecurring: d.isRecurring,
      recurringDay: d.recurringDay,
      splits: {
        create: shares.map((s) => ({
          userId: s.userId,
          share: s.share,
          isPaid: s.userId === me.userId || s.share === 0,
          paidAt: s.userId === me.userId || s.share === 0 ? new Date() : null,
        })),
      },
    },
    include: { splits: true },
  });

  res.status(201).json(expense);
});

// All bills in a house
router.get("/:houseId/expenses", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  if (!(await getMembership(req.userId!, houseId))) {
    return res.status(403).json({ error: "Not a member of this house" });
  }
  const expenses = await prisma.expense.findMany({
    where: { houseId },
    orderBy: { date: "desc" },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  res.json(expenses);
});

// What I still owe in this house
router.get("/:houseId/my-dues", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  if (!(await getMembership(req.userId!, houseId))) {
    return res.status(403).json({ error: "Not a member of this house" });
  }
  const dues = await prisma.expenseSplit.findMany({
    where: { userId: req.userId!, isPaid: false, expense: { houseId } },
    include: {
      expense: {
        select: {
          title: true,
          category: true,
          paidBy: { select: { name: true, upiId: true } },
        },
      },
    },
  });
  const totalPaise = dues.reduce((sum, s) => sum + s.share, 0);
  res.json({ totalPaise, totalRupees: totalPaise / 100, dues });
});

// Admin deletes a bill (its splits are removed automatically)
router.delete("/:houseId/expenses/:expenseId", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role !== "ADMIN") return res.status(403).json({ error: "Only the admin can delete bills" });

  const result = await prisma.expense.deleteMany({
    where: { id: Number(req.params.expenseId), houseId },
  });
  if (result.count === 0) return res.status(404).json({ error: "Bill not found" });
  res.json({ message: "Bill deleted" });
});

export default router;