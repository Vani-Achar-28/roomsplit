import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["PG", "FLAT"]).default("FLAT"),
});

const joinSchema = z.object({
  inviteCode: z.string().min(4),
});

async function getMembership(userId: number, houseId: number) {
  const m = await prisma.member.findUnique({
    where: { userId_houseId: { userId, houseId } },
  });
  return m && !m.leftAt ? m : null;
}

// True if this person still owes money, or is still owed money, in the house
async function hasUnsettled(userId: number, houseId: number) {
  const count = await prisma.expenseSplit.count({
    where: {
      isPaid: false,
      expense: { houseId },
      OR: [{ userId }, { expense: { paidById: userId } }],
    },
  });
  return count > 0;
}

// Create a house (the creator becomes ADMIN)
router.post("/", async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const userId = req.userId!;

  const house = await prisma.house.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      inviteCode: crypto.randomBytes(3).toString("hex").toUpperCase(),
      members: { create: { userId, role: "ADMIN", rotationOrder: 0 } },
    },
    include: { members: true },
  });

  res.status(201).json(house);
});

// Join a house with an invite code (becomes MEMBER). Also works to rejoin.
router.post("/join", async (req: AuthRequest, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const userId = req.userId!;

  const house = await prisma.house.findUnique({
    where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    include: { members: true },
  });
  if (!house) return res.status(404).json({ error: "Invalid invite code" });

  const existing = house.members.find((m) => m.userId === userId);
  if (existing && !existing.leftAt) {
    return res.status(409).json({ error: "You are already in this house" });
  }

  const activeCount = house.members.filter((m) => !m.leftAt).length;

  if (existing) {
    await prisma.member.update({
      where: { id: existing.id },
      data: { leftAt: null, joinedAt: new Date(), rotationOrder: activeCount },
    });
  } else {
    await prisma.member.create({
      data: { userId, houseId: house.id, role: "MEMBER", rotationOrder: activeCount },
    });
  }

  res.json({ message: "Joined", houseId: house.id, name: house.name });
});

// All houses I belong to
router.get("/mine", async (req: AuthRequest, res) => {
  const memberships = await prisma.member.findMany({
    where: { userId: req.userId!, leftAt: null },
    include: { house: true },
  });
  res.json(memberships.map((m) => ({ ...m.house, role: m.role })));
});

// Leave a house (members only; the admin must delete the house instead)
router.post("/:id/leave", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.id);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role === "ADMIN") {
    return res.status(400).json({ error: "The admin cannot leave. Delete the house instead." });
  }
  if (await hasUnsettled(me.userId, houseId)) {
    return res.status(400).json({ error: "Settle your pending payments before leaving" });
  }
  await prisma.member.update({ where: { id: me.id }, data: { leftAt: new Date() } });
  res.json({ message: "You left the house" });
});

// Admin removes a member
router.delete("/:id/members/:userId", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.id);
  const targetId = Number(req.params.userId);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role !== "ADMIN") return res.status(403).json({ error: "Only the admin can remove members" });
  if (targetId === me.userId) return res.status(400).json({ error: "You cannot remove yourself" });

  const target = await getMembership(targetId, houseId);
  if (!target) return res.status(404).json({ error: "Member not found" });
  if (await hasUnsettled(targetId, houseId)) {
    return res.status(400).json({ error: "This member has pending payments. Settle them first." });
  }
  await prisma.member.update({ where: { id: target.id }, data: { leftAt: new Date() } });
  res.json({ message: "Member removed" });
});

// Admin deletes the whole house and everything in it
router.delete("/:id", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.id);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });
  if (me.role !== "ADMIN") return res.status(403).json({ error: "Only the admin can delete the house" });

  await prisma.choreAssignment.deleteMany({ where: { chore: { houseId } } });
  await prisma.chore.deleteMany({ where: { houseId } });
  await prisma.expense.deleteMany({ where: { houseId } });
  await prisma.settlement.deleteMany({ where: { houseId } });
  await prisma.member.deleteMany({ where: { houseId } });
  await prisma.house.delete({ where: { id: houseId } });
  res.json({ message: "House deleted" });
});

// One house with its members
router.get("/:id", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.id);
  const me = await getMembership(req.userId!, houseId);
  if (!me) return res.status(403).json({ error: "Not a member of this house" });

  const house = await prisma.house.findUnique({
    where: { id: houseId },
    include: {
      members: {
        where: { leftAt: null },
        orderBy: { rotationOrder: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  res.json({ ...house, myRole: me.role });
});

export default router;