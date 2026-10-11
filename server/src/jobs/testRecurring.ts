import "dotenv/config";
import { runRecurringBills } from "./recurring";

// Usage: npx tsx src/jobs/testRecurring.ts 5
// Pretends today is the 5th of NEXT month and runs the job.
const day = Number.parseInt(process.argv[2] ?? "1", 10) || 1;
const now = new Date();
const fake = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, day, 6, 0, 0));

runRecurringBills(fake)
  .then((n) => console.log(`Created ${n} recurring bill(s) for ${fake.toDateString()}`))
  .catch(console.error)
  .finally(() => process.exit(0));