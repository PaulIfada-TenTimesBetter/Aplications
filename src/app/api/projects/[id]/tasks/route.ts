import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { eq, asc, max } from "drizzle-orm";
import { isNonEmptyString, isValidDateString } from "@/lib/validation";

export const dynamic = "force-dynamic";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const projectId = parseId(idParam);
  if (projectId === null) return Response.json({ error: "Invalid project id" }, { status: 400 });

  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.sortOrder), asc(tasks.id));

  return Response.json({ tasks: rows });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const projectId = parseId(idParam);
  if (projectId === null) return Response.json({ error: "Invalid project id" }, { status: 400 });

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  const { name, section, startDate, endDate, progress, color } = body as Record<string, unknown>;

  if (!isNonEmptyString(name)) {
    return Response.json({ error: "Task name is required" }, { status: 400 });
  }
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return Response.json({ error: "Valid start and end dates are required" }, { status: 400 });
  }
  if (startDate > endDate) {
    return Response.json({ error: "Task start date must be before end date" }, { status: 400 });
  }

  const progressValue =
    typeof progress === "number" && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : 0;

  const [{ value: currentMax }] = await db
    .select({ value: max(tasks.sortOrder) })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));

  const [created] = await db
    .insert(tasks)
    .values({
      projectId,
      name: name.trim(),
      section: isNonEmptyString(section) ? section.trim() : "General",
      startDate,
      endDate,
      progress: progressValue,
      color: isNonEmptyString(color) ? color : "#2563eb",
      sortOrder: (currentMax ?? 0) + 1,
    })
    .returning();

  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));

  return Response.json({ task: created }, { status: 201 });
}
