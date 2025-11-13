// backend/src/routes/mom.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { generateMinutesOfMeeting } from "../services/mom.js";

export const momRouter = Router();

const attendeeSchema = z.object({
  Name: z.string().min(1),
  Attendance: z.string().min(1),
});

const bodySchema = z.object({
  agenda: z.any(),              // accept any JSON object for agenda
  transcription: z.string().min(1),
  attendanceData: z.array(attendeeSchema).default([]),
  minuteType: z.enum(["narrativeSummary", "bulletPoints", "narrativeAndBullet"]).default("narrativeAndBullet"),
  notes: z.any().optional().default({}), // accept any JSON object for notes
});

type BodyInput = z.infer<typeof bodySchema>;

momRouter.post("/generate-mom", async (req: Request<{}, {}, BodyInput>, res: Response) => {
  // Optional: ensure the socket itself won’t keep hanging forever (Node’s default is ~300s)
  // If this event fires, send a 503 proactively.
  res.setTimeout(120000, () => { // 120s
    if (!res.headersSent) {
      res.status(503).json({ error: "Request socket timed out" });
    }
  });

  try {
    const parsed = bodySchema.parse(req.body);
    const { agenda, transcription, attendanceData, minuteType, notes } = parsed;

    // Enforce business timeout shorter than socket timeout
    const TIMEOUT_MS = 60_000; // 60s; tune as needed
    const minutes = await withTimeout(
      generateMinutesOfMeeting(agenda, transcription, attendanceData, minuteType, notes),
      TIMEOUT_MS,
      "Minutes generation"
    );

    res.status(200).json({
      format: "markdown",
      minutes,
    });
  } catch (err: any) {
    // explicit timeout from withTimeout
    if (err?.code === "ETIMEOUT") {
      return res.status(504).json({
        error: "Gateway Timeout",
        message: err.message,
        hint: "Try reducing input size or increasing the timeout.",
      });
    }

    // Zod validation
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }

    // Unexpected error
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
});


// helper: promise with timeout
function withTimeout<T>(p: Promise<T>, ms: number, label = "Operation"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms} ms`);
      // Mark custom code to distinguish in error handler
      // @ts-expect-error custom
      err.code = "ETIMEOUT";
      reject(err);
    }, ms);

    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}
export default momRouter;
