import { PrismaClient } from "@prisma/client";

const base = new PrismaClient();

// If the database is asleep (error P1001), wait and retry a few times
export const prisma = base.$extends({
  query: {
    async $allOperations({ args, query }) {
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          return await query(args);
        } catch (err: any) {
          const sleeping = err?.code === "P1001" || err?.name === "PrismaClientInitializationError";
          if (!sleeping || attempt === 4) throw err;
          await new Promise((r) => setTimeout(r, attempt * 1500));
        }
      }
    },
  },
});