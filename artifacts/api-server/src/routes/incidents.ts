import { Router } from "express";
import { db, incidentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/incidents", requireAuth, async (req, res) => {
  try {
    const { limit, offset } = req.query as { limit?: string; offset?: string };

    let incidents = await db
      .select()
      .from(incidentsTable)
      .orderBy(desc(incidentsTable.createdAt));

    if (offset) {
      incidents = incidents.slice(parseInt(offset));
    }
    if (limit) {
      incidents = incidents.slice(0, parseInt(limit));
    }

    res.json(
      incidents.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Get incidents error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/incidents", requireAuth, async (req, res) => {
  try {
    const { title, description, severity, affectedSystems, assignedTo } = req.body as {
      title: string;
      description?: string;
      severity: string;
      affectedSystems?: string;
      assignedTo?: string;
    };

    const [incident] = await db
      .insert(incidentsTable)
      .values({ title, description, severity, status: "open", affectedSystems, assignedTo })
      .returning();

    res.status(201).json({
      ...incident,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create incident error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/incidents/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [incident] = await db
      .select()
      .from(incidentsTable)
      .where(eq(incidentsTable.id, id))
      .limit(1);

    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    res.json({
      ...incident,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get incident error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/incidents/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { status, description, assignedTo } = req.body as {
      status?: string;
      description?: string;
      assignedTo?: string;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates["status"] = status;
    if (description) updates["description"] = description;
    if (assignedTo) updates["assignedTo"] = assignedTo;

    const [incident] = await db
      .update(incidentsTable)
      .set(updates)
      .where(eq(incidentsTable.id, id))
      .returning();

    if (!incident) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    res.json({
      ...incident,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update incident error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
