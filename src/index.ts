// backend/src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { googleRouter, teamsRouter, zoomRouter } from "./routes/zoom.js";
import momRouter from "./routes/mom.js";


const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/zoom", zoomRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/google", googleRouter);
app.use("/api", momRouter);
const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
