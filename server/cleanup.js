require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const where = { houseId: { not: 1 } };
  await prisma.choreAssignment.deleteMany({ where: { chore: where } });
  await prisma.chore.deleteMany({ where });
  await prisma.expense.deleteMany({ where });
  await prisma.settlement.deleteMany({ where });
  await prisma.member.deleteMany({ where });
  const r = await prisma.house.deleteMany({ where: { id: { not: 1 } } });
  console.log("Deleted houses:", r.count);
}
run().finally(() => prisma.$disconnect());