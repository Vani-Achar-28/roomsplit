import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

async function getMembership(userId: number, houseId: number) {
  const m = await prisma.member.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return m && !m.leftAt ? m : null;
}

// My saved UPI id
router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  res.json({ upiId: user?.upiId ?? "" });
});

// Save my UPI id
router.patch("/profile/upi", requireAuth, async (req: AuthRequest, res) => {
  const parsed = z.object({ upiId: z.string().min(3).includes("@") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid UPI id like name@upi" });
  await prisma.user.update({ where: { id: req.userId! }, data: { upiId: parsed.data.upiId } });
  res.json({ upiId: parsed.data.upiId });
});

// Money other people still owe ME (I paid the bill)
router.get("/houses/:houseId/to-collect", requireAuth, async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  if (!(await getMembership(req.userId!, houseId))) {
    return res.status(403).json({ error: "Not a member of this house" });
  }
  const items = await prisma.expenseSplit.findMany({
    where: { isPaid: false, expense: { houseId, paidById: req.userId! } },
    include: {
      user: { select: { name: true } },
      expense: { select: { title: true } },
    },
  });
  const totalPaise = items.reduce((sum, s) => sum + s.share, 0);
  res.json({ totalRupees: totalPaise / 100, items });
});

// Mark a share as paid (by the person who paid the bill, or the admin)
router.patch("/houses/:houseId/splits/:splitId/paid", requireAuth, async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });

  const split = await prisma.expenseSplit.findUnique({
    where: { id: Number(req.params.splitId) },
    include: { expense: true },
  });
  if (!split || split.expense.houseId !== houseId) return res.status(404).json({ error: "Not found" });
  if (split.expense.paidById !== me.userId && me.role !== "ADMIN") {
    return res.status(403).json({ error: "Only the person who paid the bill can confirm" });
  }

  const updated = await prisma.expenseSplit.update({
    where: { id: split.id },
    data: { isPaid: true, paidAt: new Date() },
  });
  res.json(updated);
});

export default router;