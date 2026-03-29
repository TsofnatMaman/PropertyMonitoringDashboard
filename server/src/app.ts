import cors from "cors";
import express from "express";
import monitoringRoutes from "./routes/monitoring.routes";
import propertiesRoutes from "./routes/properties.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  return res.json({ ok: true });
});

app.use("/api/properties", propertiesRoutes);
app.use("/api/monitoring", monitoringRoutes);

export default app;