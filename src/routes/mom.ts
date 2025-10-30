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
  agenda: z.string().min(1),
  transcription: z.string().min(1),
  attendanceData: z.array(attendeeSchema).default([]),
  minuteType: z.enum(["narrativeSummary", "bulletPoints", "narrativeAndBullet"]).default("narrativeAndBullet"),
  notes: z.string().optional().default(""),
});

type BodyInput = z.infer<typeof bodySchema>;

momRouter.post("/generate-mom", async (req: Request<{}, {}, BodyInput>, res: Response) => {
  try {
    const parsed = bodySchema.parse(req.body);
    const { agenda, transcription, attendanceData, minuteType, notes } = parsed;

    const minutes = await generateMinutesOfMeeting(agenda, transcription, attendanceData, minuteType, notes);

    res.status(200).json({
      format: "markdown",
      minutes,
    });
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    return res.status(500).json({ error: err?.message || "Internal error" });
  }
});

export default momRouter;
