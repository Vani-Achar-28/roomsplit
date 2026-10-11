import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import houseRoutes from "./routes/houses";
import expenseRoutes from "./routes/expenses";
import choreRoutes from "./routes/chores";
import paymentRoutes from "./routes/payments";

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});