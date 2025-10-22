// backend/src/routes/zoom.ts
import { Router } from "express";
import { fetchZoomMeetingData } from "../services/zoom.js";
import { getAppAccessToken } from "../services/teams.js";

export const zoomRouter = Router();
export const teamsRouter = Router();
zoomRouter.get("/recordings", async (req, res) => {
  const meetingId = (req.query.meetingId as string) || "";
  if (!meetingId) return res.status(400).json({ error: "meetingId required" });

  try {
    const data = await fetchZoomMeetingData({
      meetingId,
      clientId: process.env.ZOOM_CLIENT_ID!,
      clientSecret: process.env.ZOOM_CLIENT_SECRET!,
      accountId: process.env.ZOOM_ACCOUNT_ID!,
      // asVtt: true,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Internal error" });
  }
});

teamsRouter.get("/teams-token", async (req, res) => {
  // const meetingId = (req.query.meetingId as string) || "";
  // const userId = (req.query.userId as string) || ""; //
  // if (!meetingId) return res.status(400).json({ error: "meetingId required" });

  try {
    const data = await getAppAccessToken();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Internal error" });
  }
});
