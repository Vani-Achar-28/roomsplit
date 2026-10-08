import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { todayIST, memberIndexFor } from "../services/rotation";

const router = Router();
router.use(requireAuth);

const choreSchema = z.object({ title: z.string().min(2) });

async function getMembership(userId: number, houseId: number) {
  const m = await prisma.member.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return m && !m.leftAt ? m : null;
}

// Create today's assignments if they don't exist yet
async function ensureTodayAssignments(houseId: number) {
  const date = todayIST();
  const chores = await prisma.chore.findMany({
    where: { houseId, isActive: true },
    orderBy: { id: "asc" },
  });
  const members = await prisma.member.findMany({
    where: { houseId, leftAt: null },
    orderBy: { rotationOrder: "asc" },
  });
  if (chores.length === 0 || members.length === 0) return;

  await prisma.choreAssignment.createMany({
    data: chores.map((chore, i) => ({
      choreId: chore.id,
      userId: members[memberIndexFor(i, members.length, date)].userId,
      date,
    })),
    skipDuplicates: true,
  });
}

// Admin adds a chore
router.post("/:houseId/chores", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role !== "ADMIN") return res.status(403).json({ error: "Only the admin can add chores" });

  const parsed = choreSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const chore = await prisma.chore.create({ data: { houseId, title: parsed.data.title } });
  res.status(201).json(chore);
});

// Admin deletes a chore
router.delete("/:houseId/chores/:choreId", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role !== "ADMIN") return res.status(403).json({ error: "Only the admin can delete chores" });

  await prisma.chore.updateMany({
    where: { id: Number(req.params.choreId), houseId },
    data: { isActive: false },
  });
  res.json({ message: "Chore removed" });
});

// Who does what today (everyone can see this)
router.get("/:houseId/chores/today", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  if (!(await getMembership(req.userId!, houseId))) {
    return res.status(403).json({ error: "Not a member of this house" });
  }
  await ensureTodayAssignments(houseId);

  const assignments = await prisma.choreAssignment.findMany({
    where: { date: todayIST(), chore: { houseId, isActive: true } },
    include: {
      chore: { select: { title: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { choreId: "asc" },
  });
  res.json(assignments);
});

// Mark a chore as done (the person it's assigned to, or the admin)
router.patch("/:houseId/chores/assignments/:id/done", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.houseId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });

  const a = await prisma.choreAssignment.findUnique({
    where: { id: Number(req.params.id) },
    include: { chore: true },
  });
  if (!a || a.chore.houseId !== houseId) return res.status(404).json({ error: "Not found" });
  if (a.userId !== me.userId && me.role !== "ADMIN") {
    return res.status(403).json({ error: "This chore is not yours" });
  }

  const updated = await prisma.choreAssignment.update({ where: { id: a.id }, data: { done: true } });
  res.json(updated);
});

export default router;