import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { isNonEmptyString, isValidDateString, isValidViewMode } from "@/lib/validation";

export const dynamic = "force-dynamic";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return Response.json({ error: "Invalid project id" }, { status: 400 });

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, id))
    .orderBy(asc(tasks.sortOrder), asc(tasks.id));

  return Response.json({ project, tasks: projectTasks });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return Response.json({ error: "Invalid project id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  const { title, startDate, endDate, viewMode } = body as Record<string, unknown>;

  const updates: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() };

  if (title !== undefined) {
    if (!isNonEmptyString(title)) return Response.json({ error: "Title must not be empty" }, { status: 400 });
    updates.title = title.trim();
  }
  if (startDate !== undefined) {
    if (!isValidDateString(startDate)) return Response.json({ error: "Invalid start date" }, { status: 400 });
    updates.startDate = startDate;
  }
  if (endDate !== undefined) {
    if (!isValidDateString(endDate)) return Response.json({ error: "Invalid end date" }, { status: 400 });
    updates.endDate = endDate;
  }
  if (viewMode !== undefined) {
    if (!isValidViewMode(viewMode)) return Response.json({ error: "Invalid view mode" }, { status: 400 });
    updates.viewMode = viewMode;
  }

  const [updated] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
  if (!updated) return Response.json({ error: "Project not found" }, { status: 404 });

  return Response.json({ project: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) return Response.json({ error: "Invalid project id" }, { status: 400 });

  const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();
  if (!deleted) return Response.json({ error: "Project not found" }, { status: 404 });

  return Response.json({ ok: true });
}
