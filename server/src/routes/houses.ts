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

// Join a house with an invite code (becomes MEMBER)
router.post("/join", async (req: AuthRequest, res) => {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const userId = req.userId!;

  const house = await prisma.house.findUnique({
    where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
    include: { members: true },
  });
  if (!house) return res.status(404).json({ error: "Invalid invite code" });

  if (house.members.some((m) => m.userId === userId)) {
    return res.status(409).json({ error: "You are already in this house" });
  }

  await prisma.member.create({
    data: {
      userId,
      houseId: house.id,
      role: "MEMBER",
      rotationOrder: house.members.length,
    },
  });

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

// One house with its members
router.get("/:id", async (req: AuthRequest, res) => {
  const houseId = Number(req.params.id);
  const me = await prisma.member.findUnique({
    where: { userId_houseId: { userId: req.userId!, houseId } },
  });
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