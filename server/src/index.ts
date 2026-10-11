import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import authRoutes from "./routes/auth";
import houseRoutes from "./routes/houses";
import expenseRoutes from "./routes/expenses";
import choreRoutes from "./routes/chores";
import paymentRoutes from "./routes/payments";
import { runRecurringBills } from "./jobs/recurring";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "roomsplit" });
});

app.use("/api/auth", authRoutes);
app.use("/api/houses", houseRoutes);
app.use("/api/houses", expenseRoutes);
app.use("/api/houses", choreRoutes);
app.use("/api", paymentRoutes);

// Every night at 12:05 AM India time
cron.schedule(
  "5 0 * * *",
  () => {
    runRecurringBills()
      .then((n) => console.log(`Recurring bills created: ${n}`))
      .catch((e) => console.error("Recurring job failed", e));
  },
  { timezone: "Asia/Kolkata" }
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Also run once at startup, in case the server was off on a due day
  runRecurringBills()
    .then((n) => n > 0 && console.log(`Recurring bills created at startup: ${n}`))
    .catch((e) => console.error("Recurring job failed", e));
});