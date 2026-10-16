import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isNonEmptyString, isValidDateString } from "@/lib/validation";

export const dynamic = "force-dynamic";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return Response.json({ error: "Invalid task id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  const { name, section, startDate, endDate, progress, color, sortOrder } = body as Record<string, unknown>;

  const updates: Partial<typeof tasks.$inferInsert> = {};

  if (name !== undefined) {
    if (!isNonEmptyString(name)) return Response.json({ error: "Task name must not be empty" }, { status: 400 });
    updates.name = name.trim();
  }
  if (section !== undefined) {
    updates.section = isNonEmptyString(section) ? section.trim() : "General";
  }
  if (startDate !== undefined) {
    if (!isValidDateString(startDate)) return Response.json({ error: "Invalid start date" }, { status: 400 });
    updates.startDate = startDate;
  }
  if (endDate !== undefined) {
    if (!isValidDateString(endDate)) return Response.json({ error: "Invalid end date" }, { status: 400 });
    updates.endDate = endDate;
  }
  if (progress !== undefined) {
    if (typeof progress !== "number" || !Number.isFinite(progress)) {
      return Response.json({ error: "Invalid progress value" }, { status: 400 });
    }
    updates.progress = Math.max(0, Math.min(100, Math.round(progress)));
  }
  if (color !== undefined) {
    if (!isNonEmptyString(color)) return Response.json({ error: "Invalid color" }, { status: 400 });
    updates.color = color;
  }
  if (sortOrder !== undefined) {
    if (typeof sortOrder !== "number" || !Number.isFinite(sortOrder)) {
      return Response.json({ error: "Invalid sort order" }, { status: 400 });
    }
    updates.sortOrder = Math.round(sortOrder);
  }

  if (
    updates.startDate !== undefined &&
    updates.endDate !== undefined &&
    updates.startDate > updates.endDate
  ) {
    return Response.json({ error: "Task start date must be before end date" }, { status: 400 });
  }

  const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
  if (!updated) return Response.json({ error: "Task not found" }, { status: 404 });

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, updated.projectId));

  return Response.json({ task: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return Response.json({ error: "Invalid task id" }, { status: 400 });

  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  if (!deleted) return Response.json({ error: "Task not found" }, { status: 404 });

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, deleted.projectId));

  return Response.json({ ok: true });
}
