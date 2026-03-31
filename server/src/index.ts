import dotenv from "dotenv";
import path from "path";

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import gradesRoutes from "./routes/grades";
import advisoryRoutes from "./routes/advisory";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/grades", gradesRoutes);
app.use("/api/advisory", advisoryRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
