import { Router } from "express";
import { db, threatsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/threats", requireAuth, async (req, res) => {
  try {
    const { status, severity, limit } = req.query as {
      status?: string;
      severity?: string;
      limit?: string;
    };

    let query = db.select().from(threatsTable).orderBy(desc(threatsTable.createdAt));

    const threats = await query;

    let filtered = threats;
    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (severity && severity !== "all") {
      filtered = filtered.filter((t) => t.severity === severity);
    }
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit));
    }

    res.json(
      filtered.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        resolvedAt: t.resolvedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get threats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/threats", requireAuth, async (req, res) => {
  try {
    const { title, description, severity, sourceIp, destinationIp, type, port, protocol } =
      req.body as {
        title: string;
        description?: string;
        severity: string;
        sourceIp: string;
        destinationIp?: string;
        type: string;
        port?: number;
        protocol?: string;
      };

    const [threat] = await db
      .insert(threatsTable)
      .values({ title, description, severity, status: "active", sourceIp, destinationIp, type, port, protocol })
      .returning();

    res.status(201).json({
      ...threat,
      createdAt: threat.createdAt.toISOString(),
      resolvedAt: null,
    });
  } catch (err) {
    req.log.error({ err }, "Create threat error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/threats/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [threat] = await db.select().from(threatsTable).where(eq(threatsTable.id, id)).limit(1);

    if (!threat) {
      res.status(404).json({ error: "Threat not found" });
      return;
    }

    res.json({
      ...threat,
      createdAt: threat.createdAt.toISOString(),
      resolvedAt: threat.resolvedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Get threat error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/threats/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { status, description } = req.body as { status?: string; description?: string };

    const updates: Record<string, unknown> = {};
    if (status) updates["status"] = status;
    if (description) updates["description"] = description;
    if (status === "resolved") updates["resolvedAt"] = new Date();

    const [threat] = await db
      .update(threatsTable)
      .set(updates)
      .where(eq(threatsTable.id, id))
      .returning();

    if (!threat) {
      res.status(404).json({ error: "Threat not found" });
      return;
    }

    res.json({
      ...threat,
      createdAt: threat.createdAt.toISOString(),
      resolvedAt: threat.resolvedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Update threat error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
