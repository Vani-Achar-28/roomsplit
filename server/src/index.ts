import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import authRoutes from "./routes/auth";
import houseRoutes from "./routes/houses";
import expenseRoutes from "./routes/expenses";
import choreRoutes from "./routes/chores";
import paymentRoutes from "./routes/payments";
import { runRecurringBills } from "./jobs/recurring";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Max 20 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in a few minutes." },
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "roomsplit" });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
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
  runRecurringBills()
    .then((n) => n > 0 && console.log(`Recurring bills created at startup: ${n}`))
    .catch((e) => console.error("Recurring job failed", e));
});