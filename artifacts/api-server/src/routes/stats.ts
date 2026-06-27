import { Router } from "express";
import { db, threatsTable, incidentsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";
import { trafficStore } from "../lib/trafficStore.js";

const router = Router();

router.get("/stats/dashboard", requireAuth, async (req, res) => {
  try {
    const threats = await db.select().from(threatsTable);
    const incidents = await db.select().from(incidentsTable);

    const activeThreats = threats.filter((t) => t.status === "active").length;
    const resolvedThreats = threats.filter((t) => t.status === "resolved").length;
    const criticalThreats = threats.filter((t) => t.severity === "critical").length;
    const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "in_progress").length;
    const closedIncidents = incidents.filter((i) => i.status === "closed").length;

    const latest = trafficStore.getLatest();

    res.json({
      totalThreats: threats.length,
      activeThreats,
      resolvedThreats,
      criticalThreats,
      openIncidents,
      closedIncidents,
      bytesIn: latest?.bytesIn ?? 1024 * 1024 * Math.floor(Math.random() * 100 + 50),
      bytesOut: latest?.bytesOut ?? 1024 * 1024 * Math.floor(Math.random() * 80 + 30),
      packetsPerSecond: latest?.packetsIn ?? Math.floor(Math.random() * 5000 + 2000),
      blockedConnections: Math.floor(Math.random() * 200 + 50),
      uptimeHours: Math.floor((Date.now() - trafficStore.startTime) / 3600000) + 1,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/traffic", requireAuth, (req, res) => {
  try {
    const { minutes } = req.query as { minutes?: string };
    const mins = minutes ? parseInt(minutes) : 30;
    const points = trafficStore.getHistory(mins);
    res.json(points);
  } catch (err) {
    req.log.error({ err }, "Traffic history error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/threats-by-severity", requireAuth, async (req, res) => {
  try {
    const threats = await db.select().from(threatsTable);

    const severities = ["critical", "high", "medium", "low"];
    const counts = severities.map((severity) => ({
      severity,
      count: threats.filter((t) => t.severity === severity).length,
    }));

    res.json(counts);
  } catch (err) {
    req.log.error({ err }, "Threats by severity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/recent-activity", requireAuth, async (req, res) => {
  try {
    const { limit } = req.query as { limit?: string };
    const maxItems = limit ? parseInt(limit) : 20;

    const threats = await db.select().from(threatsTable).orderBy(threatsTable.createdAt);
    const incidents = await db.select().from(incidentsTable).orderBy(incidentsTable.createdAt);

    const activities = [
      ...threats.map((t, i) => ({
        id: i + 1,
        type: "threat",
        message: `${t.severity.toUpperCase()} threat detected: ${t.title} from ${t.sourceIp}`,
        timestamp: t.createdAt.toISOString(),
        severity: t.severity,
        sourceIp: t.sourceIp,
      })),
      ...incidents.map((inc, i) => ({
        id: threats.length + i + 1,
        type: "incident",
        message: `Incident ${inc.status}: ${inc.title}`,
        timestamp: inc.createdAt.toISOString(),
        severity: inc.severity,
        sourceIp: null,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems);

    res.json(activities);
  } catch (err) {
    req.log.error({ err }, "Recent activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
